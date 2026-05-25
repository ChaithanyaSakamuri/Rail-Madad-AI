import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import api from '../services/api';

export default function AdminDashboard() {
  const { logout } = useAuth();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [complaints, setComplaints] = useState([]);
  const [listLoading, setListLoading] = useState(true);

  // Fetch Admin analytics
  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/analytics');
      setData(res.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load admin analytics reports.');
      setLoading(false);
    }
  };

  const fetchAllComplaints = async () => {
    try {
      const res = await api.get('/complaints');
      setComplaints(res.data);
      setListLoading(false);
    } catch (err) {
      console.warn('Failed to fetch list.');
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    fetchAllComplaints();
  }, []);

  const handleManualEscalation = async (id) => {
    if (!window.confirm('Are you sure you want to manually escalate this ticket to the next level?')) return;
    try {
      const res = await api.post(`/complaints/${id}/escalate`);
      if (res.data) {
        alert('Ticket manually escalated.');
        fetchAnalytics();
        fetchAllComplaints();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Escalation failed');
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
      case 'Resolved': return 'bg-emerald-500/10 text-emerald-400';
      case 'Escalated': return 'bg-red-500/10 text-red-400 border border-red-500/30';
      case 'In Progress': return 'bg-amber-500/10 text-amber-400';
      case 'Assigned': return 'bg-indigo-500/10 text-indigo-400';
      default: return 'bg-slate-800 text-slate-400';
    }
  };

  // Mock Export Report
  const exportReport = (format) => {
    if (!data) return;
    const reportData = JSON.stringify(data, null, 2);
    const blob = new Blob([reportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `RailMadad_SystemReport_${new Date().toISOString().slice(0,10)}.${format === 'excel' ? 'xls' : 'json'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Harmonized palette colors
  const COLORS = ['#ef4444', '#f59e0b', '#0ea5e9', '#10b981', '#6366f1', '#64748b'];

  const getChartData = () => {
    if (!data) return { category: [], priority: [], trends: [] };
    
    const catData = data.categoryStats.map(item => ({
      name: item._id || 'General',
      value: item.count
    }));

    const prioData = data.priorityStats.map(item => ({
      name: item._id,
      Count: item.count
    }));

    const trendsData = data.trends.map(item => ({
      date: item._id,
      Complaints: item.count
    }));

    return { category: catData, priority: prioData, trends: trendsData };
  };

  const charts = getChartData();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      
      {/* Navbar Header */}
      <header className="border-b border-slate-800 bg-slate-900 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <span className="bg-red-600 text-white font-black text-xs px-2.5 py-1 rounded tracking-widest uppercase">
            Rail Madad AI
          </span>
          <h1 className="text-sm font-bold text-slate-300">Administrative Analytics Command</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => exportReport('excel')}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 font-semibold transition"
          >
            Export Excel
          </button>
          <button
            onClick={logout}
            className="text-xs font-semibold text-slate-400 hover:text-white border border-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            Sign Out
          </button>
        </div>
      </header>

      {loading ? (
        <div className="text-center py-20 text-slate-500 text-xs">Loading analytics pipeline...</div>
      ) : (
        <main className="max-w-7xl mx-auto p-6 space-y-8">
          
          {/* Analytics Summary Row */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center">
              <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Complaints</h4>
              <p className="text-2xl font-black text-white mt-1">{data.summary.total}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center">
              <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Resolved Cases</h4>
              <p className="text-2xl font-black text-emerald-400 mt-1">{data.summary.resolved}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center">
              <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pending Tasks</h4>
              <p className="text-2xl font-black text-amber-500 mt-1">{data.summary.pending}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center">
              <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Escalated</h4>
              <p className="text-2xl font-black text-red-500 mt-1">{data.summary.escalated}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center">
              <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">SLA Breach Rate</h4>
              <p className="text-2xl font-black text-indigo-400 mt-1">{data.summary.breachRate}%</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center">
              <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Avg Resolution</h4>
              <p className="text-2xl font-black text-sky-400 mt-1">{data.summary.avgResolutionTime || 'N/A'} min</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Category breakdown (5 cols) */}
            <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Grievance Category Spread</h3>
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wide">Category Distribution</p>
              </div>
              <div className="h-60 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.category}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {charts.category.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] font-semibold text-slate-400">
                {charts.category.map((item, idx) => (
                  <div key={item.name} className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="truncate">{item.name} ({item.value})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trends Line chart (8 cols) */}
            <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Weekly Grievance Load</h3>
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wide">Submission Trend (Last 7 Days)</p>
              </div>
              <div className="h-64 mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={charts.trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" style={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }} />
                    <Legend style={{ fontSize: 10 }} />
                    <Line type="monotone" dataKey="Complaints" stroke="#ef4444" strokeWidth={3} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
          </div>

          {/* Performance & Overrides Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Officer Performance rankings (7 cols) */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <h3 className="text-sm font-bold text-white mb-1">Department Performance Index</h3>
              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wide mb-4">Officer Workloads and Resolution Rates</p>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="py-3">Officer Name</th>
                      <th className="py-3">Department</th>
                      <th className="py-3 text-center">Assigned</th>
                      <th className="py-3 text-center">Resolved</th>
                      <th className="py-3 text-center">Success Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {data.officerPerformance.map((officer) => (
                      <tr key={officer.id} className="text-slate-300">
                        <td className="py-3.5 font-bold text-white">{officer.name}</td>
                        <td className="py-3.5 text-slate-400">{officer.department}</td>
                        <td className="py-3.5 text-center font-mono">{officer.totalAssigned}</td>
                        <td className="py-3.5 text-center font-mono text-emerald-400">{officer.resolved}</td>
                        <td className="py-3.5 text-center">
                          <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800 font-mono font-bold text-[11px]">
                            {officer.rate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Zone heat maps or audit logs (5 cols) */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Station Heatmap Logs</h3>
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wide mb-4">Stations Reporting Most Grievances</p>
              </div>
              <div className="space-y-3.5">
                {data.stationStats.length === 0 ? (
                  <p className="text-slate-500 text-xs py-8 text-center">No station audits reported.</p>
                ) : (
                  data.stationStats.map((station, idx) => (
                    <div key={station._id} className="flex items-center justify-between text-xs bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                      <div className="flex items-center space-x-3">
                        <span className="w-5 h-5 rounded bg-slate-900 flex items-center justify-center font-bold text-[10px] text-slate-500 border border-slate-800">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-white uppercase">{station._id}</span>
                      </div>
                      <span className="bg-red-500/10 border border-red-500/20 text-red-400 font-mono font-bold text-[10px] px-2 py-0.5 rounded">
                        {station.count} Grievances
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Ticket list & Manual Override Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-1">System Grievance Logs</h3>
            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wide mb-6">Manage all tickets and trigger manual SLA escalations</p>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-3">Ticket ID</th>
                    <th className="py-3">Category</th>
                    <th className="py-3">Details</th>
                    <th className="py-3">Priority</th>
                    <th className="py-3">Status</th>
                    <th className="py-3">Esc Level</th>
                    <th className="py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {listLoading ? (
                    <tr><td colSpan="7" className="text-center py-6 text-slate-500">Loading details...</td></tr>
                  ) : complaints.length === 0 ? (
                    <tr><td colSpan="7" className="text-center py-6 text-slate-500">No logs found.</td></tr>
                  ) : (
                    complaints.map((c) => (
                      <tr key={c._id} className="text-slate-300 hover:bg-slate-950/20 transition">
                        <td className="py-4 font-bold text-white">{c.complaintId}</td>
                        <td className="py-4 font-bold text-slate-400">{c.category}</td>
                        <td className="py-4 max-w-xs truncate">{c.complaintText}</td>
                        <td className="py-4">
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${getPriorityColor(c.priority)}`}>
                            {c.priority}
                          </span>
                        </td>
                        <td className="py-4">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase ${getStatusColor(c.status)}`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="py-4 text-center font-mono font-bold text-slate-400">
                          {c.escalationLevel}
                        </td>
                        <td className="py-4 text-right">
                          {['Submitted', 'Assigned', 'In Progress', 'Escalated'].includes(c.status) && c.escalationLevel < 3 ? (
                            <button
                              onClick={() => handleManualEscalation(c._id)}
                              className="text-[10px] bg-red-950/40 hover:bg-red-900 border border-red-500/20 text-red-400 font-bold px-2 py-1 rounded"
                            >
                              Escalate
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-bold">No Action</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      )}

    </div>
  );
}
