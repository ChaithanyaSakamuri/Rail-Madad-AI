import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import api from '../services/api';

// Countdown Timer Component for Ticket SLAs
function SlaTimer({ deadline }) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const calculateTime = () => {
      const difference = new Date(deadline).getTime() - Date.now();
      setTimeLeft(Math.floor(difference / 1000));
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  if (timeLeft <= 0) {
    return (
      <span className="bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-black uppercase px-2 py-1 rounded">
        SLA Breached 🚨
      </span>
    );
  }

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  return (
    <span className="bg-slate-800 text-amber-400 border border-slate-700 text-[10px] font-mono font-bold px-2 py-1 rounded">
      ⏱️ {hours > 0 ? `${hours}h ` : ''}{minutes}m {seconds}s
    </span>
  );
}

export default function OfficerDashboard() {
  const { user, logout } = useAuth();
  
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  // Modal Action State
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [actionStatus, setActionStatus] = useState('In Progress');
  const [remark, setRemark] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  const fetchComplaints = async () => {
    try {
      const res = await api.get('/complaints');
      setComplaints(res.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch assigned complaints.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();

    const socket = io('http://localhost:5002');
    socket.emit('join_room', user.id);

    socket.on('new_notification', (data) => {
      // Refresh list
      fetchComplaints();
    });

    socket.on('complaint_assigned', () => {
      fetchComplaints();
    });

    socket.on('complaint_updated', () => {
      fetchComplaints();
    });

    return () => {
      socket.disconnect();
    };
  }, [user.id]);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setModalLoading(true);
    
    try {
      const res = await api.put(`/complaints/${selectedComplaint._id}/status`, {
        status: actionStatus,
        remark
      });
      if (res.data) {
        setSuccess(`Ticket updated to ${actionStatus}`);
        setSelectedComplaint(null);
        setRemark('');
        fetchComplaints();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update complaint.');
    } finally {
      setModalLoading(false);
    }
  };

  const getPriorityColor = (p) => {
    switch (p) {
      case 'P1': return 'bg-red-500/10 text-red-500 border border-red-500/20';
      case 'P2': return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
      case 'P3': return 'bg-sky-500/10 text-sky-500 border border-sky-500/20';
      default: return 'bg-slate-800 text-slate-400';
    }
  };

  const getStatusColor = (s) => {
    switch (s) {
      case 'Resolved': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'Escalated': return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'In Progress': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'Assigned': return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
      default: return 'bg-slate-800 text-slate-400';
    }
  };

  // Compute Counters
  const pendingCount = complaints.filter(c => ['Assigned', 'In Progress'].includes(c.status)).length;
  const resolvedCount = complaints.filter(c => c.status === 'Resolved').length;
  const escalatedCount = complaints.filter(c => c.status === 'Escalated').length;
  const emergencyCount = complaints.filter(c => c.priority === 'P1' && c.status !== 'Resolved').length;

  // Filter complaints list
  const filteredComplaints = complaints.filter(c => {
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || c.priority === priorityFilter;
    return matchesStatus && matchesPriority;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <span className="bg-red-600 text-white font-black text-xs px-2.5 py-1 rounded tracking-widest uppercase">
            Rail Madad AI
          </span>
          <h1 className="text-sm font-bold text-slate-300">Officer Dashboard</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-xs font-bold text-white">{user.name}</p>
            <p className="text-[10px] text-red-500 uppercase font-semibold">{user.department} Lead</p>
          </div>
          <button
            onClick={logout}
            className="text-xs font-semibold text-slate-400 hover:text-white border border-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        
        {/* Top Cards row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
            <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Assigned Pending</h4>
            <p className="text-3xl font-black text-white mt-2">{pendingCount}</p>
            <div className="absolute right-4 bottom-4 text-slate-800 text-3xl font-black select-none">🚨</div>
          </div>
          
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
            <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Resolved Tickets</h4>
            <p className="text-3xl font-black text-emerald-400 mt-2">{resolvedCount}</p>
            <div className="absolute right-4 bottom-4 text-emerald-950/40 text-3xl font-black select-none">✓</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
            <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">SLA Escalations</h4>
            <p className="text-3xl font-black text-red-400 mt-2">{escalatedCount}</p>
            <div className="absolute right-4 bottom-4 text-red-950/40 text-3xl font-black select-none">⚡</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
            <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Emergency Cases (P1)</h4>
            <p className="text-3xl font-black text-amber-500 mt-2">{emergencyCount}</p>
            <div className="absolute right-4 bottom-4 text-amber-950/40 text-3xl font-black select-none">🔥</div>
          </div>
        </div>

        {/* Filters and List */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-800 pb-5 mb-6 gap-4">
            <div>
              <h2 className="text-base font-bold text-white">Assigned Grievance Tickets</h2>
              <p className="text-slate-400 text-xs mt-0.5">Filter and manage tickets routed to your department.</p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {/* Status Filter */}
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase mr-2">Status</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="All">All Statuses</option>
                  <option value="Assigned">Assigned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Escalated">Escalated</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase mr-2">Priority</span>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="All">All Priorities</option>
                  <option value="P1">P1 (Emergency)</option>
                  <option value="P2">P2 (Safety)</option>
                  <option value="P3">P3 (Service)</option>
                  <option value="P4">P4 (General)</option>
                </select>
              </div>
            </div>
          </div>

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-xl text-xs mb-5">
              {success}
            </div>
          )}

          {/* Tickets List */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-slate-500 text-xs">Loading assigned complaints...</div>
            ) : filteredComplaints.length === 0 ? (
              <p className="text-slate-500 text-xs text-center py-12">No complaints match your filters.</p>
            ) : (
              filteredComplaints.map((c) => (
                <div
                  key={c._id}
                  className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4 hover:border-slate-700 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-slate-300 font-black text-sm">{c.complaintId}</span>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${getPriorityColor(c.priority)}`}>
                        {c.priority}
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase ${getStatusColor(c.status)}`}>
                        {c.status}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3">
                      {/* Show SLA timer if not resolved */}
                      {c.status !== 'Resolved' && <SlaTimer deadline={c.slaDeadline} />}
                      <span className="text-[10px] text-slate-500 font-mono">
                        SLA Target: {new Date(c.slaDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-8 space-y-2">
                      <p className="text-xs text-slate-400 font-medium">Passenger Complaint:</p>
                      <p className="text-sm text-slate-200 leading-relaxed font-sans">{c.complaintText}</p>
                      
                      {/* Passenger Details */}
                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-slate-400 pt-2 border-t border-slate-900">
                        <p>👤 Passenger: <span className="text-slate-200 font-bold">{c.passenger?.name || 'Anonymous'}</span></p>
                        <p>📞 Phone: <span className="text-slate-200 font-bold">{c.passenger?.phoneNumber || 'N/A'}</span></p>
                        <p>🚂 Train: <span className="text-slate-200 font-bold">{c.trainNumber || 'N/A'}</span></p>
                        <p>🚪 Coach: <span className="text-slate-200 font-bold">{c.coachNumber || 'N/A'}</span></p>
                        <p>🚉 Station: <span className="text-slate-200 font-bold">{c.station || 'N/A'}</span></p>
                      </div>
                    </div>

                    <div className="md:col-span-4 flex flex-col justify-between items-end gap-4 border-l border-slate-900 pl-4">
                      {c.imageUrl && (
                        <div className="text-right">
                          <p className="text-[10px] text-slate-500 font-bold mb-1">Attached Evidence:</p>
                          <a href={`http://localhost:5002${c.imageUrl}`} target="_blank" rel="noreferrer" className="block">
                            <img
                              src={`http://localhost:5002${c.imageUrl}`}
                              alt="Grievance Attach"
                              className="w-16 h-16 rounded-lg object-cover border border-slate-800 hover:scale-105 transition"
                            />
                          </a>
                        </div>
                      )}

                      {/* Action trigger button */}
                      {['Assigned', 'In Progress', 'Escalated'].includes(c.status) && (
                        <button
                          onClick={() => setSelectedComplaint(c)}
                          className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition duration-200 shadow-md shadow-red-600/10"
                        >
                          Update Status
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Action Dialog Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
            <h3 className="text-base font-bold text-white mb-2">Update Ticket: {selectedComplaint.complaintId}</h3>
            <p className="text-slate-400 text-xs mb-6">Change ticket status and add action remarks visible to the passenger.</p>
            
            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Target Status</label>
                <select
                  value={actionStatus}
                  onChange={(e) => setActionStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 transition text-white"
                >
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Remarks / Resolution Log</label>
                <textarea
                  required
                  rows={3}
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="e.g. AC cooling coils cleared, water filled in coach tank, or security personnel dispatched."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 transition text-white"
                />
              </div>

              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="flex-1 border border-slate-800 hover:border-slate-700 text-slate-400 font-bold py-3 rounded-xl transition text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition text-xs flex items-center justify-center"
                >
                  {modalLoading ? <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" /> : 'Apply Action'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
