import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../services/api';

export default function ComplaintTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchComplaintDetails = async () => {
    try {
      // Find complaint by complaintId
      const res = await api.get('/complaints');
      const found = res.data.find(c => c.complaintId === id);
      if (found) {
        // Fetch detailed version
        const detailRes = await api.get(`/complaints/${found._id}`);
        setComplaint(detailRes.data);
      } else {
        setError('Ticket not found in system logs.');
      }
      setLoading(false);
    } catch (err) {
      setError('Failed to load ticket timeline.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaintDetails();

    const socket = io('http://localhost:5002');
    
    // Join room of the complaint
    if (complaint?._id) {
      socket.emit('join_room', complaint.passenger._id);
    }

    socket.on('complaint_updated', () => {
      fetchComplaintDetails();
    });

    return () => {
      socket.disconnect();
    };
  }, [id, complaint?._id]);

  const getPriorityColor = (p) => {
    switch (p) {
      case 'P1': return 'bg-red-500/10 text-red-500 border border-red-500/20';
      case 'P2': return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
      case 'P3': return 'bg-sky-500/10 text-sky-500 border border-sky-500/20';
      default: return 'bg-slate-800 text-slate-400';
    }
  };

  const getStatusNodeColor = (s) => {
    switch (s) {
      case 'Resolved': return 'bg-emerald-500 border-emerald-400';
      case 'Escalated': return 'bg-red-500 border-red-400';
      case 'In Progress': return 'bg-amber-500 border-amber-400';
      case 'Assigned': return 'bg-indigo-500 border-indigo-400';
      default: return 'bg-blue-600 border-blue-400';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <Link to="/" className="bg-red-600 text-white font-black text-xs px-2.5 py-1 rounded tracking-widest uppercase">
            Rail Madad AI
          </Link>
          <span className="text-slate-400 text-xs hidden md:inline">Live Tracking Portal</span>
        </div>
        
        <button
          onClick={() => navigate(-1)}
          className="text-xs font-semibold text-slate-400 hover:text-white border border-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition"
        >
          ← Go Back
        </button>
      </header>

      {loading ? (
        <div className="text-center py-20 text-slate-500 text-xs">Connecting to tracking server...</div>
      ) : error ? (
        <div className="max-w-md mx-auto mt-20 p-6 bg-slate-900 border border-slate-800 rounded-3xl text-center">
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <button onClick={() => navigate('/')} className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition">
            Home
          </button>
        </div>
      ) : (
        <main className="max-w-4xl mx-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Left Column: Details (5 cols) */}
          <div className="md:col-span-5 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
              <div>
                <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ticket Info</h4>
                <h2 className="text-xl font-black text-white mt-1">{complaint.complaintId}</h2>
              </div>

              <div className="space-y-3.5 border-t border-slate-800/60 pt-4 text-xs">
                <div>
                  <p className="text-slate-500 text-[10px] uppercase font-bold">Category</p>
                  <p className="text-slate-300 font-semibold mt-0.5">{complaint.category}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-[10px] uppercase font-bold">Priority Status</p>
                  <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 mt-1 rounded-full ${getPriorityColor(complaint.priority)}`}>
                    {complaint.priority}
                  </span>
                </div>
                <div>
                  <p className="text-slate-500 text-[10px] uppercase font-bold">Location Details</p>
                  <p className="text-slate-300 font-semibold mt-0.5">
                    Train: {complaint.trainNumber || 'N/A'} | Coach: {complaint.coachNumber || 'N/A'}
                  </p>
                  {complaint.station && <p className="text-slate-400 text-[11px] mt-0.5">Near: {complaint.station}</p>}
                </div>
                <div>
                  <p className="text-slate-500 text-[10px] uppercase font-bold">AI Processing Confidence</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="w-full bg-slate-950 rounded-full h-1.5 border border-slate-800">
                      <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${complaint.aiDetails?.confidence * 100}%` }}></div>
                    </div>
                    <span className="font-mono text-white text-[10px] font-bold">
                      {Math.round(complaint.aiDetails?.confidence * 100)}%
                    </span>
                  </div>
                </div>
                {complaint.assignedOfficer && (
                  <div className="border-t border-slate-800/60 pt-4">
                    <p className="text-slate-500 text-[10px] uppercase font-bold mb-1.5">Assigned Officer</p>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                      <p className="font-bold text-white text-xs">{complaint.assignedOfficer.name}</p>
                      <p className="text-[10px] text-red-400 mt-0.5">{complaint.assignedOfficer.department}</p>
                      <p className="text-[10px] text-slate-500 mt-1">📞 {complaint.assignedOfficer.phoneNumber || 'N/A'}</p>
                    </div>
                  </div>
                )}
              </div>

              {complaint.imageUrl && (
                <div className="border-t border-slate-800/60 pt-4">
                  <p className="text-slate-500 text-[10px] uppercase font-bold mb-2">Evidence Image</p>
                  <img
                    src={`http://localhost:5002${complaint.imageUrl}`}
                    alt="Upload"
                    className="w-full max-h-48 rounded-xl object-cover border border-slate-800"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Timeline Step Tracker (7 cols) */}
          <div className="md:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <h2 className="text-base font-bold text-white mb-1">Grievance Life Cycle Map</h2>
              <p className="text-slate-400 text-xs">Real-time status changes and supervisor remarks.</p>
            </div>

            {/* Stepper Timeline */}
            <div className="relative border-l border-slate-800 pl-6 ml-4 space-y-8 my-8 flex-1 pt-4">
              {complaint.timeline.map((step, idx) => (
                <div key={step._id || idx} className="relative">
                  {/* Status Circle Node */}
                  <span className={`absolute -left-[31px] top-0 rounded-full w-4 h-4 border-2 flex items-center justify-center ${getStatusNodeColor(step.status)}`}>
                    <span className="w-1.5 h-1.5 bg-slate-950 rounded-full" />
                  </span>
                  
                  <div>
                    <div className="flex items-center space-x-3">
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">{step.status}</h4>
                      <span className="text-[9px] text-slate-500 font-mono">
                        {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{step.remark}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-800/60 pt-4 text-center">
              <span className="text-[10px] text-slate-500 font-medium">
                Complaint Registered on {new Date(complaint.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

        </main>
      )}

    </div>
  );
}
