import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import api from '../services/api';

export default function LandingPage() {
  const { isAuthenticated, user } = useAuth();
  const [stats, setStats] = useState({
    total: 342,
    resolved: 310,
    pending: 18,
    escalated: 14,
    avgTime: '24 mins'
  });

  useEffect(() => {
    // Attempt to fetch real stats from public api if possible
    const fetchStats = async () => {
      try {
        const res = await api.get('/health');
        // If server is up, we can fetch public statistics
      } catch (err) {
        // use mock
      }
    };
    fetchStats();
  }, []);

  const getDashboardLink = () => {
    if (!isAuthenticated) return '/login';
    if (user?.role === 'admin') return '/admin';
    if (user?.role === 'officer') return '/officer';
    return '/passenger';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: 'easeOut' }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden font-sans">
      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-red-600 text-white font-black text-xl px-3 py-1 rounded shadow-md shadow-red-600/30 tracking-wider">
            RAIL MADAD AI
          </div>
          <span className="text-slate-400 text-xs hidden md:inline border-l border-slate-800 pl-3">
            Grievance Auto-Classifier
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <Link to="/" className="text-sm font-medium hover:text-red-500 transition">About</Link>
          <Link to={getDashboardLink()} className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition duration-200 shadow-lg shadow-red-600/20">
            {isAuthenticated ? 'Dashboard' : 'Sign In'}
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Decorative Grid Backing */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.08),transparent_50%)] pointer-events-none" />

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="bg-red-950/40 border border-red-500/20 rounded-full px-4 py-1 text-xs text-red-400 mb-6 font-semibold uppercase tracking-wider"
        >
          🌐 AI Patent-Pending Grievance Router
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-4xl sm:text-6xl font-black tracking-tight max-w-4xl leading-tight bg-gradient-to-r from-white via-slate-100 to-red-400 bg-clip-text text-transparent"
        >
          Next-Generation AI Grievance <span className="text-red-500">Auto-Classifier</span> for Indian Railways
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-slate-400 mt-6 text-base sm:text-lg max-w-2xl leading-relaxed"
        >
          Automatically read complaints in Hindi & English, extract train details, classify category, detect urgency, and instantly route tickets to TTEs, RPF, and station masters.
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-10 flex flex-wrap gap-4 justify-center"
        >
          <Link
            to={getDashboardLink()}
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-4 rounded-xl transition shadow-xl shadow-red-600/20 text-md flex items-center space-x-2"
          >
            <span>Launch Portal</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
          </Link>
          <a
            href="#features"
            className="border border-slate-700 hover:border-slate-500 text-slate-300 font-bold px-8 py-4 rounded-xl transition text-md"
          >
            How it Works
          </a>
        </motion.div>
      </section>

      {/* Stats Counter Row */}
      <section className="bg-slate-900 border-y border-slate-800 py-10 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8 text-center">
          <div>
            <h3 className="text-3xl font-black text-white">{stats.total}</h3>
            <p className="text-slate-400 text-xs mt-1 uppercase font-semibold tracking-wider">Total Complaints</p>
          </div>
          <div>
            <h3 className="text-3xl font-black text-red-500">{stats.pending}</h3>
            <p className="text-slate-400 text-xs mt-1 uppercase font-semibold tracking-wider">Active Tickets</p>
          </div>
          <div>
            <h3 className="text-3xl font-black text-emerald-400">{stats.resolved}</h3>
            <p className="text-slate-400 text-xs mt-1 uppercase font-semibold tracking-wider">Resolved</p>
          </div>
          <div>
            <h3 className="text-3xl font-black text-amber-500">{stats.escalated}</h3>
            <p className="text-slate-400 text-xs mt-1 uppercase font-semibold tracking-wider">SLA Escalated</p>
          </div>
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-3xl font-black text-indigo-400">{stats.avgTime}</h3>
            <p className="text-slate-400 text-xs mt-1 uppercase font-semibold tracking-wider">Avg Resolution</p>
          </div>
        </div>
      </section>

      {/* AI Pipeline workflow */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold text-white">The AI Classification Pipeline</h2>
          <p className="text-slate-400 mt-4">Real-time processing flow of grievances from passenger submission to official resolution.</p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {/* Card 1 */}
          <motion.div variants={itemVariants} className="bg-slate-900 border border-slate-800 p-8 rounded-2xl hover:border-red-500/30 transition duration-300 relative group">
            <div className="absolute top-6 right-6 text-slate-700 group-hover:text-red-500/20 font-black text-4xl select-none">01</div>
            <div className="bg-red-500/10 text-red-500 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Multilingual NER</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Accepts complaints in natural text (English, Hindi, Hinglish). Extracts train numbers, coach numbers, stations, and issue entities automatically using custom regex & AI.
            </p>
          </motion.div>

          {/* Card 2 */}
          <motion.div variants={itemVariants} className="bg-slate-900 border border-slate-800 p-8 rounded-2xl hover:border-red-500/30 transition duration-300 relative group">
            <div className="absolute top-6 right-6 text-slate-700 group-hover:text-red-500/20 font-black text-4xl select-none">02</div>
            <div className="bg-red-500/10 text-red-500 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Classification & Priority</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Classifies grievance type (Cleanliness, Medical, Catering, Crime, Maintenance) and identifies SLA priority level from P1 (emergency) to P4 (general).
            </p>
          </motion.div>

          {/* Card 3 */}
          <motion.div variants={itemVariants} className="bg-slate-900 border border-slate-800 p-8 rounded-2xl hover:border-red-500/30 transition duration-300 relative group">
            <div className="absolute top-6 right-6 text-slate-700 group-hover:text-red-500/20 font-black text-4xl select-none">03</div>
            <div className="bg-red-500/10 text-red-500 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Workload Smart Routing</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Auto-assigns the ticket to the nearest or least-busy officer (TTE, Station Master, RPF, etc.) with real-time Socket.io and Email alerts.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* Patent details */}
      <section className="bg-slate-900/40 border-t border-slate-900 py-24 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-red-500 font-semibold text-sm uppercase tracking-wider">Patent Innovation</h3>
            <h2 className="text-3xl font-extrabold text-white mt-2 leading-tight">Multilingual AI Classifier for Passenger Grievances</h2>
            <p className="text-slate-400 mt-6 leading-relaxed text-sm">
              Traditional complaint processes involve manual categorizing and routing, leading to delayed action. This patent focuses on an edge NLP system that identifies context immediately from voice or text logs, handles Hindi/English bilingual inputs natively, translates them dynamically, extracts coach identifiers, and monitors ticket timers (SLA).
            </p>
            <div className="mt-8 space-y-4">
              <div className="flex items-start space-x-3">
                <span className="bg-emerald-500/10 text-emerald-400 p-1 rounded-full">✓</span>
                <span className="text-slate-300 text-sm">Language Auto-Detection & Translation Pipeline</span>
              </div>
              <div className="flex items-start space-x-3">
                <span className="bg-emerald-500/10 text-emerald-400 p-1 rounded-full">✓</span>
                <span className="text-slate-300 text-sm">Urgency Keyword & Visual Multi-Modal Triggering</span>
              </div>
              <div className="flex items-start space-x-3">
                <span className="bg-emerald-500/10 text-emerald-400 p-1 rounded-full">✓</span>
                <span className="text-slate-300 text-sm">Dynamic SLA-breach Escalation matrix (P1 = 15m to P4 = 24h)</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-slate-900 border border-slate-800 p-8 rounded-2xl relative shadow-2xl"
          >
            <h4 className="text-slate-300 font-bold text-lg mb-6 border-b border-slate-800 pb-3 flex items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 mr-3 animate-ping" />
              Live Demo: NLP Response Sample
            </h4>
            <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs text-slate-300 space-y-2 border border-slate-800">
              <p className="text-slate-500">// Natural text input</p>
              <p className="text-red-400">"ट्रेन 12951 के कोच A2 में मेडिकल इमरजेंसी है, यात्री बेहोश है।"</p>
              <br />
              <p className="text-slate-500">// AI Extraction Output JSON</p>
              <pre className="text-amber-300">
{`{
  "language": "Hindi",
  "trainNumber": "12951",
  "coachNumber": "A2",
  "station": "",
  "issueType": "Medical emergency, passenger fainted",
  "category": "Medical Emergency",
  "priority": "P1 (Emergency)",
  "routingTarget": "Medical Team",
  "slaMinutes": 15
}`}
              </pre>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-8 px-6 text-center text-slate-500 text-xs">
        <p>© 2026 Rail Madad AI. Indian Railways Grievance Platform. Patent Pending.</p>
      </footer>
    </div>
  );
}
