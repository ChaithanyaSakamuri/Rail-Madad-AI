import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import CartDrawer from '../components/CartDrawer';
import PurchaseModal from '../components/PurchaseModal';
import { 
  Search, 
  User, 
  Heart, 
  ShoppingBag, 
  Menu, 
  X, 
  LogOut, 
  Settings, 
  Package 
} from 'lucide-react';

const NAV_CATEGORIES = [
  { label: 'ALL CLOTHING', value: '' },
  { label: 'CORD-SETS', value: 'Cord-Sets' },
  { label: 'KURTIS', value: 'Kurtis' },
  { label: 'PARTYWEAR', value: 'Partywear (Three-Piece Set)' },
  { label: 'LEGGINGS', value: 'Leggings' },
  { label: 'STRAIGHT PANTS', value: 'Straight Pants' }
];

export default function ShopLayout({ children, onSearch, onCategoryChange, activeCategory, cartOpenExternal, onCartOpenExternal }) {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const { items } = useCart();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // Sync external open trigger (e.g. from StoreFront after add-to-cart)
  useEffect(() => {
    if (cartOpenExternal) {
      setCartOpen(true);
      if (onCartOpenExternal) onCartOpenExternal();
    }
  }, [cartOpenExternal]);

  const totalItems = items?.reduce((sum, i) => sum + i.quantity, 0) || 0;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(search);
    } else {
      navigate(`/?search=${encodeURIComponent(search)}`);
    }
  };

  const handleCategoryClick = (catValue) => {
    if (onCategoryChange) {
      onCategoryChange(catValue);
    } else {
      navigate(catValue ? `/?category=${encodeURIComponent(catValue)}` : '/');
    }
    setMenuOpen(false);
  };

  const handleOpenCart = () => {
    setCartOpen(true);
  };

  const handleCartCheckout = () => {
    setCartOpen(false);
    setCheckoutOpen(true);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', display: 'flex', flexDirection: 'column' }}>
      {/* Main Header */}
      <header style={{ 
        background: '#ffffff', 
        borderBottom: '1px solid #eaeaec', 
        position: 'sticky', 
        top: 0, 
        zIndex: 50, 
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)' 
      }}>
        <div className="page-container header-main-bar" style={{ display: 'flex', alignItems: 'center', height: 80, gap: 32 }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', flexShrink: 0 }}>
            <div style={{
              background: 'linear-gradient(135deg, #ff3f6c 0%, #ff905a 100%)',
              color: '#fff',
              width: 38,
              height: 38,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 20,
              letterSpacing: '-1.5px',
              fontStyle: 'italic',
              boxShadow: '0 2px 8px rgba(255, 63, 108, 0.25)'
            }}>
              D
            </div>
            <span className="logo-text" style={{ 
              fontFamily: "'Assistant', sans-serif", 
              fontSize: 20, 
              fontWeight: 800, 
              color: '#282c3f', 
              letterSpacing: '0.04em',
              textTransform: 'uppercase'
            }}>
              DEEPYA COLLECTIONS
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="desktop-nav" style={{ display: 'flex', gap: 24, flex: 1, height: '100%', alignItems: 'center' }}>
            {NAV_CATEGORIES.map(cat => {
              const isActive = activeCategory === cat.value || (!activeCategory && cat.value === '');
              return (
                <button 
                  key={cat.label} 
                  onClick={() => handleCategoryClick(cat.value)}
                  style={{
                    padding: '0 4px', 
                    height: '100%',
                    fontSize: '13px', 
                    fontWeight: 700, 
                    letterSpacing: '0.08em',
                    transition: 'all 0.15s', 
                    background: 'none',
                    color: '#282c3f',
                    borderBottom: `4px solid ${isActive ? '#ff3f6c' : 'transparent'}`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    position: 'relative',
                    top: '2px'
                  }}
                  onMouseEnter={e => {
                    if (!isActive) e.currentTarget.style.borderBottom = '4px solid #ff3f6c';
                  }}
                  onMouseLeave={e => {
                    if (!isActive) e.currentTarget.style.borderBottom = '4px solid transparent';
                  }}
                >
                  {cat.label}
                </button>
              );
            })}
          </nav>

          {/* Right Section: Search & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexShrink: 0 }}>
            {/* Search Input Box */}
            <form onSubmit={handleSearchSubmit} className="desktop-search" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              background: '#f5f5f6', 
              borderRadius: 'var(--radius-sm)', 
              padding: '10px 14px', 
              gap: 10,
              width: 280,
              border: '1px solid transparent',
              transition: 'all 0.2s'
            }}
            onFocusCapture={e => e.currentTarget.style.border = '1px solid #d4d5d9'}
            onBlurCapture={e => e.currentTarget.style.border = '1px solid transparent'}
            >
              <Search size={16} className="text-gray-400" />
              <input 
                type="text" 
                placeholder="Search for products, brands and more" 
                value={search} 
                onChange={e => setSearch(e.target.value)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  fontSize: '13px', 
                  color: '#282c3f', 
                  width: '100%', 
                  outline: 'none',
                  fontWeight: 400
                }} 
              />
            </form>

            {/* Actions: Profile, Wishlist, Bag */}
            <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Profile Icon Action */}
              <div 
                style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
                onMouseEnter={() => setProfileMenuOpen(true)}
                onMouseLeave={() => setProfileMenuOpen(false)}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#282c3f', gap: 3 }}>
                  {user?.avatar ? (
                    <img src={user.avatar} alt="" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <User size={18} />
                  )}
                  <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.04em' }}>PROFILE</span>
                </div>

                {/* Dropdown Menu */}
                {profileMenuOpen && (
                  <div style={{ 
                    position: 'absolute', 
                    right: -40, 
                    top: '100%', 
                    background: '#ffffff', 
                    borderRadius: 'var(--radius-sm)', 
                    boxShadow: 'var(--shadow-lg)', 
                    border: '1px solid #eaeaec', 
                    minWidth: 220, 
                    zIndex: 100, 
                    overflow: 'hidden',
                    padding: '8px 0',
                    textAlign: 'left'
                  }}>
                    {isAuthenticated ? (
                      <>
                        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f5f5f6' }}>
                          <p style={{ fontSize: '13px', fontWeight: 700, color: '#282c3f' }}>Hello {user?.name?.split(' ')[0]}</p>
                          <p style={{ fontSize: '11px', color: '#7e818c', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email || user?.phoneNumber}</p>
                        </div>
                        
                        <Link to="/my-orders" style={dropdownItemStyle}
                          onMouseEnter={e => e.currentTarget.style.background = '#f5f5f6'}
                          onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                          <Package size={14} /> My Orders
                        </Link>
                        
                        {isAdmin && (
                          <Link to="/admin" style={{ ...dropdownItemStyle, color: '#ff3f6c', fontWeight: 700 }}
                            onMouseEnter={e => e.currentTarget.style.background = '#ffe6eb'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                            <Settings size={14} /> Admin Dashboard
                          </Link>
                        )}
                        
                        <button onClick={logout} style={{ 
                          width: '100%', 
                          textAlign: 'left', 
                          padding: '10px 16px', 
                          fontSize: '12px', 
                          fontWeight: 600,
                          color: '#282c3f', 
                          background: 'none', 
                          border: 'none', 
                          cursor: 'pointer', 
                          borderTop: '1px solid #f5f5f6', 
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          marginTop: 6
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f5f5f6'}
                          onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                          <LogOut size={14} /> Sign Out
                        </button>
                      </>
                    ) : (
                      <div style={{ padding: '12px 16px' }}>
                        <p style={{ fontSize: '13px', fontWeight: 700, color: '#282c3f', marginBottom: 4 }}>Welcome</p>
                        <p style={{ fontSize: '11px', color: '#7e818c', marginBottom: 12 }}>To access account and manage orders</p>
                        <Link to="/login" style={{
                          display: 'block',
                          textAlign: 'center',
                          padding: '8px 12px',
                          border: '1px solid #eaeaec',
                          borderRadius: '2px',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#ff3f6c',
                          textDecoration: 'none',
                          transition: 'all 0.15s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#ff3f6c'; e.currentTarget.style.background = '#ffe6eb'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#eaeaec'; e.currentTarget.style.background = 'none'; }}
                        >
                          LOGIN / SIGNUP
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Wishlist Action */}
              <Link to="/my-orders" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#282c3f', gap: 3 }}>
                <Heart size={18} />
                <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.04em' }}>WISHLIST</span>
              </Link>

              {/* Bag / Cart Icon — opens CartDrawer */}
              <button 
                onClick={handleOpenCart}
                style={{ 
                  position: 'relative', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  background: 'none', 
                  color: '#282c3f',
                  gap: 3,
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <ShoppingBag size={18} />
                <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.04em' }}>BAG</span>
                {totalItems > 0 && (
                  <span style={{ 
                    position: 'absolute', 
                    top: -4, 
                    right: 0, 
                    width: 15, 
                    height: 15, 
                    background: '#ff3f6c', 
                    color: '#ffffff', 
                    borderRadius: '50%', 
                    fontSize: '9px', 
                    fontWeight: 700, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}>
                    {totalItems}
                  </span>
                )}
              </button>
            </div>

            {/* Mobile Navigation Toggle Button */}
            <button 
              onClick={() => setMenuOpen(!menuOpen)} 
              className="mobile-menu-btn"
              style={{ padding: 6, background: 'none', color: '#282c3f', display: 'none' }}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar Wrapper */}
        <div className="mobile-search-wrapper" style={{ display: 'none', padding: '0 16px 12px 16px', background: '#ffffff' }}>
          <form onSubmit={handleSearchSubmit} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            background: '#f5f5f6', 
            borderRadius: 'var(--radius-sm)', 
            padding: '8px 12px', 
            gap: 8,
            width: '100%',
            border: '1px solid transparent'
          }}>
            <Search size={14} className="text-gray-400" />
            <input 
              type="text" 
              placeholder="Search for products, brands and more" 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              style={{ 
                background: 'none', 
                border: 'none', 
                fontSize: '12px', 
                color: '#282c3f', 
                width: '100%', 
                outline: 'none',
                fontWeight: 400
              }} 
            />
          </form>
        </div>

        {/* Mobile menu navigation drawer */}
        {menuOpen && (
          <div style={{ borderTop: '1px solid #eaeaec', padding: '16px', background: '#ffffff' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {NAV_CATEGORIES.map(cat => (
                <button 
                  key={cat.label} 
                  onClick={() => handleCategoryClick(cat.value)}
                  style={{ 
                    padding: '8px 12px', 
                    borderRadius: '2px', 
                    fontSize: '14px', 
                    fontWeight: 700,
                    textAlign: 'left',
                    background: activeCategory === cat.value || (!activeCategory && cat.value === '') ? '#ffe6eb' : 'none', 
                    color: activeCategory === cat.value || (!activeCategory && cat.value === '') ? '#ff3f6c' : '#282c3f', 
                    border: 'none',
                    letterSpacing: '0.05em'
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>{children}</main>

      {/* Premium Myntra-style Footer */}
      <footer style={{ background: '#fafafa', borderTop: '1px solid #eaeaec', color: '#282c3f', padding: '60px 20px 30px', marginTop: 80 }}>
        <div className="page-container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, marginBottom: 40 }}>
            <div>
              <h4 style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16, color: '#282c3f' }}>Online Shopping</h4>
              {NAV_CATEGORIES.map(cat => (
                <button 
                  key={cat.label} 
                  onClick={() => handleCategoryClick(cat.value)}
                  style={{ display: 'block', background: 'none', color: '#525252', fontSize: '13px', padding: '4px 0', cursor: 'pointer', textAlign: 'left' }}
                >
                  {cat.label === 'WOMEN' ? "All Women's Collection" : cat.label}
                </button>
              ))}
            </div>

            <div>
              <h4 style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16, color: '#282c3f' }}>Customer Policies</h4>
              {['Contact Us', 'FAQ', 'T&C', 'Terms Of Use', 'Track Orders', 'Shipping', 'Cancellation', 'Returns'].map(l => (
                <p key={l} style={{ color: '#525252', fontSize: '13px', padding: '4px 0', cursor: 'pointer' }}>{l}</p>
              ))}
            </div>

            <div>
              <h4 style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16, color: '#282c3f' }}>Experience Deepya App</h4>
              <p style={{ color: '#7e818c', fontSize: '12px', lineHeight: 1.5, marginBottom: 16 }}>Stay updated with new releases, fashion lookbooks and exclusive discount coupons.</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ background: '#000', color: '#fff', padding: '8px 12px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, cursor: 'pointer', textAlign: 'center', flex: 1 }}>
                  GET IT ON <br/><span style={{ fontSize: '12px' }}>Google Play</span>
                </div>
                <div style={{ background: '#000', color: '#fff', padding: '8px 12px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, cursor: 'pointer', textAlign: 'center', flex: 1 }}>
                  Download on the <br/><span style={{ fontSize: '12px' }}>App Store</span>
                </div>
              </div>
            </div>
          </div>
          
          <hr style={{ border: 'none', borderTop: '1px solid #eaeaec', margin: '30px 0' }} />
          
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, color: '#7e818c', fontSize: '12px' }}>
            <span>© 2026 www.deepyacollections.in. All rights reserved.</span>
            <span>In association with Myntra Fashion Hub.</span>
          </div>
        </div>
      </footer>

      {/* ===== CART DRAWER ===== */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={handleCartCheckout}
      />

      {/* ===== CHECKOUT PURCHASE MODAL (cart checkout) ===== */}
      <PurchaseModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        isCartCheckout={true}
        onPurchaseSuccess={() => {}}
      />

      {/* CSS Rules to override mobile header state */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
          .logo-text { font-size: 14px !important; }
          .header-main-bar { height: 60px !important; gap: 12px !important; }
        }
        @media (max-width: 480px) {
          .header-actions { gap: 10px !important; }
          .logo-text { font-size: 12px !important; }
        }
      `}</style>
    </div>
  );
}

const dropdownItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '10px 16px',
  fontSize: '12px',
  fontWeight: 600,
  color: '#282c3f',
  textDecoration: 'none',
  transition: 'all 0.15s'
};
