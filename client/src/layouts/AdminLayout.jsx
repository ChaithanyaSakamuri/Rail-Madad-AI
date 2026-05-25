import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DashIcon = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
const ProductsIcon = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>;
const OrdersIcon = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>;
const ChartIcon = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
const AIIcon = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2a10 10 0 110 20A10 10 0 0112 2z"/><path d="M12 8v4l3 3"/></svg>;
const StoreIcon = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const LogoutIcon = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const PackingIcon = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>;

const NAV_ITEMS = [
  { path: '/admin', label: 'Dashboard', icon: <DashIcon /> },
  { path: '/admin/products', label: 'Products', icon: <ProductsIcon /> },
  { path: '/admin/packing', label: 'Packing', icon: <PackingIcon /> },
  { path: '/admin/orders', label: 'Orders', icon: <OrdersIcon /> },
  { path: '/admin/analytics', label: 'Analytics', icon: <ChartIcon /> },
  { path: '/admin/ai-insights', label: 'AI Insights', icon: <AIIcon /> },
];

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isActive = (path) => location.pathname === path;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--neutral-50)' }}>
      {/* Sidebar Backdrop on Mobile when open */}
      {isMobile && sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 180 }}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        width: isMobile ? 260 : (sidebarOpen ? 260 : 72), 
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #1a0a14 0%, #2d1220 50%, #1a0a14 100%)',
        position: 'fixed', 
        top: 0, 
        left: isMobile ? (sidebarOpen ? 0 : -260) : 0, 
        zIndex: 200,
        display: 'flex', 
        flexDirection: 'column',
        transition: 'left 0.3s ease, width 0.3s ease', 
        overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {sidebarOpen && (
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', letterSpacing: '0.05em' }}>DEEPYA COLLECTIONS</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Admin Panel</div>
              </div>
            )}
          </div>
        </div>

        {/* Toggle button (Desktop only) */}
        {!isMobile && (
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ margin: '12px 16px', padding: '8px', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.06)', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ transform: sidebarOpen ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.3s' }}>
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
        )}

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '8px 12px' }}>
          {NAV_ITEMS.map(item => (
            <Link key={item.path} to={item.path}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: sidebarOpen ? '12px 16px' : '12px', borderRadius: 'var(--radius-md)', marginBottom: 4,
                color: isActive(item.path) ? '#fff' : 'rgba(255,255,255,0.6)',
                background: isActive(item.path) ? 'linear-gradient(135deg, var(--rose-700), var(--mauve-600))' : 'transparent',
                textDecoration: 'none', transition: 'all 0.2s', whiteSpace: 'nowrap',
                boxShadow: isActive(item.path) ? '0 4px 16px rgba(225,29,85,0.3)' : 'none',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
              }}
              onMouseEnter={e => { if (!isActive(item.path)) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
              onMouseLeave={e => { if (!isActive(item.path)) e.currentTarget.style.background = 'transparent'; }}>
              <span style={{ flexShrink: 0 }}>{item.icon}</span>
              {sidebarOpen && <span style={{ fontSize: 14, fontWeight: 500 }}>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Bottom section */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          {/* View Store */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: sidebarOpen ? '10px 16px' : '10px', borderRadius: 'var(--radius-md)', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', marginBottom: 4, justifyContent: sidebarOpen ? 'flex-start' : 'center', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <StoreIcon />{sidebarOpen && <span style={{ fontSize: 14 }}>View Store</span>}
          </Link>
          {/* User + Logout */}
          {sidebarOpen && user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.06)', marginTop: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--rose-600), var(--mauve-500))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14, color: '#fff', fontWeight: 600 }}>
                {user.avatar ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : user.name?.[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', truncate: true, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Administrator</p>
              </div>
              <button onClick={logout} style={{ padding: 6, borderRadius: 6, background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', flexShrink: 0 }}
                title="Sign out">
                <LogoutIcon />
              </button>
            </div>
          )}
          {!sidebarOpen && (
            <button onClick={logout} style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}>
              <LogoutIcon />
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div style={{ 
        marginLeft: isMobile ? 0 : (sidebarOpen ? 260 : 72), 
        flex: 1, 
        transition: 'margin-left 0.3s ease', 
        minHeight: '100vh',
        paddingTop: isMobile ? 56 : 0
      }}>
        {/* Mobile Header Bar */}
        {isMobile && (
          <header style={{ 
            height: 56, 
            background: '#ffffff', 
            borderBottom: '1px solid var(--neutral-200)', 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            zIndex: 150, 
            display: 'flex', 
            alignItems: 'center', 
            padding: '0 16px', 
            gap: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--rose-700)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>DEEPYA COLLECTIONS (ADMIN)</span>
          </header>
        )}
        {children}
      </div>
    </div>
  );
}
