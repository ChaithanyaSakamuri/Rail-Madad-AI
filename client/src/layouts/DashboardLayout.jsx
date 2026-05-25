import { useState, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Menu, X, LogOut, Settings, Home, Package, BarChart3, Zap, ShoppingBag } from 'lucide-react';
import AIChatBot from '../components/AIChatBot';

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/products', icon: Package, label: user?.role === 'admin' ? 'Products' : 'Shop' },
    ...(user?.role === 'admin' ? [
      { path: '/orders', icon: ShoppingBag, label: 'Orders' },
      { path: '/analytics', icon: BarChart3, label: 'Analytics' },
      { path: '/ai-insights', icon: Zap, label: 'AI Insights' },
    ] : []),
  ];


  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-slate-900/80 backdrop-blur-md border-r border-white/10 transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          {sidebarOpen && <h1 className="text-xl font-bold text-white">SmartStore</h1>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-400 hover:text-white"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50'
                    : 'text-gray-300 hover:bg-white/10'
                }`}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-2">
          <Link
            to="/settings"
            className="flex items-center gap-3 p-3 rounded-lg text-gray-300 hover:bg-white/10 transition-colors"
          >
            <Settings size={20} />
            {sidebarOpen && <span>Settings</span>}
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>

      {/* Global AI Copilot Chatbot */}
      <AIChatBot />
    </div>
  );
};

export default DashboardLayout;
