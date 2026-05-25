import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import api from '../services/api';

export default function PassengerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [notifications, setNotifications] = useState([]);

  // Form states
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Real-time NLP preview states
  const [nlpPreview, setNlpPreview] = useState(null);
  const [nlpLoading, setNlpLoading] = useState(false);

  // Fetch complaints and notifications
  const fetchData = async () => {
    try {
      const resComplaints = await api.get('/complaints');
      setComplaints(resComplaints.data);
      
      const resNotifications = await api.get('/complaints/notifications/me');
      setNotifications(resNotifications.data);
      
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch data.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Setup Socket.io
    const socket = io('http://localhost:5002');
    
    // Join room for this passenger
    socket.emit('join_room', user.id);

    socket.on('new_notification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      // Refresh complaints when status changes
      fetchData();
    });

    socket.on('complaint_updated', () => {
      fetchData();
    });

    return () => {
      socket.disconnect();
    };
  }, [user.id]);

  // Run on-the-fly NLP extraction preview when text is entered
  const runNlpPreview = async () => {
    if (!text.trim() || text.trim().length < 15) return;
    setNlpLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/nlp/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      if (res.ok) {
        const data = await res.json();
        setNlpPreview(data);
      }
    } catch (err) {
      console.warn('NLP microservice unavailable for preview:', err.message);
    } finally {
      setNlpLoading(false);
    }
  };

  // Debounced/Triggered preview
  useEffect(() => {
    const timer = setTimeout(() => {
      runNlpPreview();
    }, 1200);
    return () => clearTimeout(timer);
  }, [text]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) {
      setError('Please describe your complaint.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('complaintText', text);
      if (image) {
        formData.append('image', image);
      }

      const res = await api.post('/complaints/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data) {
        setSuccess(`Complaint submitted successfully! ID: ${res.data.complaint.complaintId}`);
        setText('');
        setImage(null);
        setPreviewUrl(null);
        setNlpPreview(null);
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error logging complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  const getPriorityColor = (p) => {
    switch (p) {
      case 'P1': return 'bg-red-500/10 text-red-500 border border-red-500/20';
      case 'P2': return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
      case 'P3': return 'bg-sky-500/10 text-sky-500 border border-sky-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border border-slate-800';
    }
  };

  const getStatusColor = (s) => {
    switch (s) {
      case 'Resolved': return 'bg-emerald-500/10 text-emerald-400';
      case 'Escalated': return 'bg-red-500/10 text-red-400 border border-red-500/30';
      case 'In Progress': return 'bg-amber-500/10 text-amber-400';
      case 'Assigned': return 'bg-indigo-500/10 text-indigo-400';
      default: return 'bg-slate-800 text-slate-400';
    }
  };

  const handleMarkNotificationsRead = async () => {
    try {
      await api.put('/complaints/notifications/mark-read');
      fetchData();
    } catch (err) {
      console.warn('Could not mark read');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <Link to="/" className="bg-red-600 text-white font-black text-xs px-2.5 py-1 rounded tracking-widest uppercase">
            Rail Madad AI
          </Link>
          <h1 className="text-sm font-bold text-slate-300 hidden md:block">Passenger Dashboard</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-white">{user.name}</p>
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Passenger Account</p>
          </div>
          <button
            onClick={logout}
            className="text-xs font-semibold text-slate-400 hover:text-white border border-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Body Grid */}
      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column - Lodge Complaint (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-1">Submit a Grievance</h2>
            <p className="text-slate-400 text-xs mb-6">Describe the issue naturally in Hindi or English (e.g. AC failure, coach cleanliness, food delay, safety concern).</p>
            
            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs mb-5">{error}</div>}
            {success && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-xl text-xs mb-5">{success}</div>}

            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Issue Description (हिंदी / English)</label>
                <textarea
                  required
                  rows={4}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="e.g. AC is not cooling in train 12951 coach A3. Temperature is very high near Vadodara station."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 transition text-white"
                />
              </div>

              {/* Photo Evidence upload */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Optional Photo Evidence</label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center justify-center border border-slate-800 border-dashed rounded-2xl px-4 py-3 bg-slate-950 hover:bg-slate-900 cursor-pointer transition text-xs font-bold text-slate-300">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    Attach Picture
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                  {previewUrl && (
                    <div className="relative">
                      <img src={previewUrl} alt="Preview" className="w-12 h-12 rounded-xl object-cover border border-slate-800" />
                      <button type="button" onClick={() => { setImage(null); setPreviewUrl(null); }} className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-0.5 text-[8px]">✕</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Live NLP Preview Block */}
              {nlpLoading && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 flex items-center justify-center space-x-3">
                  <div className="w-4 h-4 border-2 border-t-transparent border-red-500 rounded-full animate-spin" />
                  <span className="text-xs text-slate-400">AI parsing complaint context...</span>
                </div>
              )}

              {nlpPreview && !nlpLoading && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <h4 className="text-slate-300 font-bold text-[10px] uppercase tracking-wider flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-ping" />
                    AI NLP Instant Scan
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <p className="text-slate-500 text-[10px] uppercase font-bold">Category</p>
                      <p className="text-white font-semibold mt-0.5">{nlpPreview.category}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-[10px] uppercase font-bold">Priority</p>
                      <p className={`font-semibold mt-0.5 ${nlpPreview.priority === 'P1' ? 'text-red-400' : 'text-slate-300'}`}>{nlpPreview.priority}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-[10px] uppercase font-bold">Train / Coach</p>
                      <p className="text-white font-semibold mt-0.5">
                        {nlpPreview.trainNumber || 'N/A'}{nlpPreview.coachNumber ? ` / ${nlpPreview.coachNumber}` : ''}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-[10px] uppercase font-bold">Station</p>
                      <p className="text-white font-semibold mt-0.5">{nlpPreview.station || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl transition text-sm flex items-center justify-center shadow-lg shadow-red-600/10"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-t-2 border-r-2 border-white rounded-full animate-spin" />
                ) : (
                  'Lodge Complaint'
                )}
              </button>

            </form>
          </div>
          
        </div>

        {/* Right Column - Complaint History (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Notifications Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white flex items-center">
                <span className="relative flex h-2 w-2 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                Live Activity Alerts
              </h2>
              {notifications.some(n => !n.read) && (
                <button
                  onClick={handleMarkNotificationsRead}
                  className="text-[10px] text-red-400 hover:text-white underline font-semibold"
                >
                  Clear Unread
                </button>
              )}
            </div>
            
            <div className="max-h-48 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
              {notifications.length === 0 ? (
                <p className="text-slate-500 text-xs text-center py-4">No recent activity logs.</p>
              ) : (
                notifications.map((n) => (
                  <div key={n._id} className={`p-3 rounded-xl border text-xs ${n.read ? 'bg-slate-950/40 border-slate-950/60 text-slate-400' : 'bg-slate-950 border-red-500/10 text-slate-200'}`}>
                    <p className="font-semibold text-slate-300">{n.title}</p>
                    <p className="text-[11px] text-slate-400 mt-1">{n.message}</p>
                    <p className="text-[9px] text-slate-500 mt-1.5">{new Date(n.createdAt).toLocaleTimeString()}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active complaints history */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h2 className="text-sm font-bold text-white mb-4">Lodged Grievances ({complaints.length})</h2>
            
            <div className="max-h-96 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
              {loading ? (
                <div className="text-center py-8 text-slate-500 text-xs">Loading complaints...</div>
              ) : complaints.length === 0 ? (
                <p className="text-slate-500 text-xs text-center py-8">You have not submitted any complaints yet.</p>
              ) : (
                complaints.map((c) => (
                  <div
                    key={c._id}
                    onClick={() => navigate(`/track/${c.complaintId}`)}
                    className="bg-slate-950 border border-slate-800 hover:border-slate-700 p-4 rounded-2xl cursor-pointer transition flex justify-between items-start"
                  >
                    <div className="space-y-1.5 max-w-[70%]">
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-300 font-bold text-xs">{c.complaintId}</span>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${getPriorityColor(c.priority)}`}>
                          {c.priority}
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs truncate">{c.complaintText}</p>
                      <p className="text-[10px] text-slate-500">
                        {new Date(c.createdAt).toLocaleDateString()} {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <div className="text-right space-y-2">
                      <span className={`inline-block text-[9px] font-bold px-2 py-1 rounded-md uppercase ${getStatusColor(c.status)}`}>
                        {c.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
