import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ShopLayout from '../layouts/ShopLayout';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import PurchaseModal from '../components/PurchaseModal';
import api from '../services/api';
import { toast } from 'react-toastify';
import { Heart, ShoppingBag, Star, Truck, ShieldCheck, RefreshCw, ChevronRight } from 'lucide-react';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState(null);
  const [mainImage, setMainImage] = useState('');
  const [qty, setQty] = useState(1);
  const [buyNowOpen, setBuyNowOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [pincode, setPincode] = useState('');
  const [pincodeChecked, setPincodeChecked] = useState(false);
  const [pincodeError, setPincodeError] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/products/${id}`);
        setProduct(res.data);
        setMainImage(res.data.image || '');
        if (res.data.sizes?.length > 0) setSelectedSize(res.data.sizes[0]);
        if (res.data.colors?.length > 0) setSelectedColor(res.data.colors[0]);
      } catch {
        toast.error('Product not found');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, navigate]);

  const discountedPrice = product ? product.price * (1 - (product.discount || 0) / 100) : 0;

  const handleAddToCart = () => {
    if (!selectedSize && product.sizes?.length > 0) {
      toast.warning('Please select a size');
      return;
    }
    addItem({ ...product, selectedSize, selectedColor: selectedColor?.name || '', quantity: qty });
    setCartOpen(true);
    toast.success('Added to bag! 🛔 View your bag →', { autoClose: 2000 });
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!selectedSize && product.sizes?.length > 0) { toast.warning('Please select a size'); return; }
    // Open checkout modal — user will fill address & pay via QR
    setBuyNowOpen(true);
  };

  const handleCheckPincode = (e) => {
    e.preventDefault();
    if (!pincode || pincode.length !== 6 || !/^\d+$/.test(pincode)) {
      setPincodeError(true);
      setPincodeChecked(false);
      return;
    }
    setPincodeError(false);
    setPincodeChecked(true);
  };

  if (loading) {
    return (
      <ShopLayout>
        <div className="page-container" style={{ padding: '40px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
          <div className="skeleton" style={{ height: 500, borderRadius: 0 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[100, 60, 40, 200, 100].map((w, i) => <div key={i} className="skeleton" style={{ height: i === 3 ? 80 : 20, width: `${w}%` }} />)}
          </div>
        </div>
      </ShopLayout>
    );
  }

  if (!product) return null;

  const allImages = [product.image, ...(product.images || [])].filter(Boolean);

  return (
    <ShopLayout cartOpenExternal={cartOpen} onCartOpenExternal={() => setCartOpen(false)}>
      <div className="page-container" style={{ padding: '24px 20px 80px' }}>
        
        {/* Navigation Breadcrumb */}
        <nav style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 24, fontSize: '12px', color: '#7e818c' }}>
          <Link to="/" style={{ textDecoration: 'none' }}>Home</Link>
          <ChevronRight size={12} />
          {product.category && (
            <>
              <Link to={`/?category=${encodeURIComponent(product.category)}`} style={{ textDecoration: 'none' }}>{product.category}</Link>
              <ChevronRight size={12} />
            </>
          )}
          <span style={{ color: '#282c3f', fontWeight: 700 }}>{product.name}</span>
        </nav>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 0.9fr)', gap: 48, alignItems: 'start' }} className="product-detail-grid">
          
          {/* Left Column: Image Gallery (Myntra Grid Layout) */}
          <div style={{ display: 'flex', gap: 16 }}>
            {/* Gallery Thumbnails Column (Desktop only) */}
            {allImages.length > 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 80, flexShrink: 0 }} className="desktop-thumbnails">
                {allImages.map((img, i) => (
                  <button 
                    key={i} 
                    onClick={() => setMainImage(img)}
                    style={{ 
                      width: 80, 
                      height: 106, 
                      overflow: 'hidden', 
                      border: `1.5px solid ${mainImage === img ? '#ff3f6c' : '#d4d5d9'}`, 
                      cursor: 'pointer', 
                      padding: 0, 
                      background: 'none',
                      borderRadius: '2px'
                    }}
                  >
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}

            {/* Large Active Main Image Card */}
            <div style={{ flex: 1, position: 'relative', border: '1px solid #eaeaec' }}>
              {mainImage ? (
                <img 
                  src={mainImage} 
                  alt={product.name} 
                  style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }} 
                />
              ) : (
                <div style={{ width: '100%', aspectRatio: '3/4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80, background: '#eaeaec' }}>👗</div>
              )}
              {product.discount > 0 && (
                <span style={{ 
                  position: 'absolute', 
                  top: 16, 
                  left: 16, 
                  background: '#ff905a', 
                  color: '#ffffff', 
                  padding: '4px 10px', 
                  fontWeight: 700, 
                  fontSize: '11px',
                  borderRadius: '2px'
                }}>
                  {product.discount}% OFF
                </span>
              )}
              
              {/* Mobile horizontal scrollable thumbnails */}
              {allImages.length > 1 && (
                <div className="mobile-thumbnails">
                  {allImages.map((img, i) => (
                    <button 
                      key={i} 
                      onClick={() => setMainImage(img)}
                      className={`mobile-thumbnail-btn ${mainImage === img ? 'active' : ''}`}
                    >
                      <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Product Detail Content panel */}
          <div style={{ color: '#282c3f' }}>
            
            {/* Brand Header */}
            <h2 style={{ fontSize: '24px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#282c3f', marginBottom: 2 }}>
              Deepya
            </h2>
            <h3 style={{ fontSize: '18px', fontWeight: 400, color: '#7e818c', marginBottom: 12 }}>
              {product.name}
            </h3>

            {/* Rating Stars Badge */}
            {product.rating > 0 && (
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: 6, 
                border: '1px solid #eaeaec', 
                padding: '4px 10px', 
                borderRadius: '2px', 
                marginBottom: 20,
                fontSize: '14px',
                fontWeight: 700
              }}>
                <span>{product.rating.toFixed(1)}</span>
                <Star size={14} fill="#03a685" stroke="none" />
                <span style={{ color: '#d4d5d9', fontWeight: 300 }}>|</span>
                <span style={{ color: '#7e818c', fontWeight: 500 }}>{product.reviewCount || 140} Ratings</span>
              </div>
            )}

            <hr style={{ border: 'none', borderTop: '1px solid #eaeaec', marginBottom: 20 }} />

            {/* Pricing Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 4 }}>
              <span style={{ fontSize: '24px', fontWeight: 800 }}>
                ₹{Math.round(discountedPrice).toLocaleString()}
              </span>
              {product.discount > 0 && (
                <>
                  <span style={{ fontSize: '18px', color: '#7e818c', textDecoration: 'line-through' }}>
                    ₹{product.price.toLocaleString()}
                  </span>
                  <span style={{ fontSize: '18px', fontWeight: 700, color: '#ff905a' }}>
                    ({product.discount}% OFF)
                  </span>
                </>
              )}
            </div>
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#03a685', marginBottom: 24 }}>
              inclusive of all taxes
            </p>

            {/* Size Selector circles */}
            {product.sizes?.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.05em' }}>SELECT SIZE</p>
                  <button style={{ fontSize: '12px', color: '#ff3f6c', fontWeight: 700, background: 'none', cursor: 'pointer' }}>SIZE CHART →</button>
                </div>
                
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {product.sizes.map(s => (
                    <button 
                      key={s} 
                      onClick={() => setSelectedSize(s)}
                      style={{ 
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        fontSize: '13px', 
                        fontWeight: 700, 
                        border: `1.5px solid ${selectedSize === s ? '#ff3f6c' : '#d4d5d9'}`, 
                        background: '#ffffff', 
                        color: selectedSize === s ? '#ff3f6c' : '#282c3f', 
                        cursor: 'pointer', 
                        transition: 'all 0.15s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selector */}
            {product.colors?.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 12 }}>
                  SELECT COLOR: <span style={{ fontWeight: 400, color: '#7e818c', textTransform: 'capitalize' }}>{selectedColor?.name}</span>
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  {product.colors.map((c, i) => (
                    <button 
                      key={i} 
                      onClick={() => setSelectedColor(c)} 
                      title={c.name}
                      style={{ 
                        width: 28, 
                        height: 28, 
                        borderRadius: '50%', 
                        background: c.hex || c.name, 
                        border: `2px solid ${selectedColor?.name === c.name ? '#ff3f6c' : 'transparent'}`, 
                        cursor: 'pointer', 
                        transition: 'all 0.15s', 
                        boxShadow: selectedColor?.name === c.name ? '0 0 0 2px #ffffff' : 'none' 
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Quantity +/- select */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 30 }}>
              <p style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.05em' }}>QTY:</p>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d4d5d9', borderRadius: '2px', overflow: 'hidden' }}>
                <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ padding: '6px 12px', background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: '#7e818c' }}>−</button>
                <span style={{ padding: '6px 14px', fontSize: 13, fontWeight: 700, borderLeft: '1px solid #d4d5d9', borderRight: '1px solid #d4d5d9', color: '#282c3f' }}>{qty}</span>
                <button onClick={() => setQty(q => Math.min(product.stock || 10, q + 1))} style={{ padding: '6px 12px', background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: '#7e818c' }}>+</button>
              </div>
              <span style={{ fontSize: '12px', color: product.stock < 5 ? '#ff3f6c' : '#7e818c', fontWeight: 600 }}>
                {product.stock === 0 ? 'Out of stock' : product.stock < 5 ? `Only ${product.stock} left!` : 'In stock'}
              </span>
            </div>

            {/* CTAs: ADD TO BAG & WISHLIST */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 32 }} className="cta-flex">
              <button 
                onClick={handleAddToCart} 
                disabled={product.stock === 0}
                style={{ 
                  flex: 1.2, 
                  background: '#ff3f6c', 
                  color: '#ffffff', 
                  padding: '16px 20px', 
                  fontWeight: 700, 
                  fontSize: '14px', 
                  letterSpacing: '0.05em', 
                  textTransform: 'uppercase', 
                  borderRadius: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  cursor: 'pointer',
                  boxShadow: 'none'
                }}
                className="btn-primary"
              >
                <ShoppingBag size={18} />
                ADD TO BAG
              </button>
              
              <button 
                onClick={handleBuyNow} 
                disabled={product.stock === 0}
                style={{ 
                  flex: 0.8, 
                  background: '#ffffff', 
                  color: '#282c3f', 
                  padding: '16px 20px', 
                  fontWeight: 700, 
                  fontSize: '14px', 
                  letterSpacing: '0.05em', 
                  textTransform: 'uppercase', 
                  borderRadius: '2px',
                  border: '1px solid #d4d5d9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  cursor: 'pointer'
                }}
              >
                ⚡ BUY NOW
              </button>
            </div>

            {/* Delivery Availability Checker (Myntra Pin Code tool) */}
            <div style={{ border: '1px solid #eaeaec', padding: 20, borderRadius: '2px', marginBottom: 30 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                <Truck size={18} className="text-gray-600" />
                <span style={{ fontSize: '13px', fontWeight: 700 }}>DELIVERY OPTIONS</span>
              </div>
              
              <form onSubmit={handleCheckPincode} style={{ display: 'flex', gap: 10 }}>
                <input 
                  type="text" 
                  placeholder="Enter pincode" 
                  maxLength={6}
                  value={pincode}
                  onChange={e => setPincode(e.target.value.replace(/\D/g, ''))}
                  style={{ 
                    flex: 1, 
                    padding: '8px 12px', 
                    border: '1px solid #d4d5d9', 
                    borderRadius: '2px', 
                    fontSize: '13px', 
                    outline: 'none',
                    color: '#282c3f'
                  }} 
                />
                <button 
                  type="submit"
                  style={{ 
                    background: 'none', 
                    color: '#ff3f6c', 
                    fontWeight: 700, 
                    fontSize: '13px', 
                    cursor: 'pointer',
                    border: 'none'
                  }}
                >
                  CHECK
                </button>
              </form>

              {pincodeChecked && (
                <p style={{ color: '#03a685', fontSize: '12px', fontWeight: 700, marginTop: 8 }}>
                  ✓ Delivery available by next week! Free COD option also active.
                </p>
              )}
              {pincodeError && (
                <p style={{ color: '#ff3f6c', fontSize: '12px', fontWeight: 700, marginTop: 8 }}>
                  ⚠ Please enter a valid 6-digit Indian PIN code.
                </p>
              )}
              
              <p style={{ color: '#7e818c', fontSize: '11px', marginTop: 10, lineHeight: 1.4 }}>
                Please enter PIN code to check availability, Cash on Delivery (COD) services, or exact dispatch dates.
              </p>
            </div>

            {/* Specifications Details list */}
            <div style={{ border: '1px solid #eaeaec', borderRadius: '2px', padding: 20 }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: 16, letterSpacing: '0.04em' }}>PRODUCT SPECIFICATIONS</h4>
              <div className="specs-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px', fontSize: '13px' }}>
                {product.material && (
                  <div>
                    <span style={{ color: '#7e818c', display: 'block', marginBottom: 2 }}>Material / Fabric</span>
                    <span style={{ fontWeight: 700 }}>{product.material}</span>
                  </div>
                )}
                {product.occasion?.length > 0 && (
                  <div>
                    <span style={{ color: '#7e818c', display: 'block', marginBottom: 2 }}>Occasion</span>
                    <span style={{ fontWeight: 700 }}>{product.occasion.join(', ')}</span>
                  </div>
                )}
                {product.sku && (
                  <div>
                    <span style={{ color: '#7e818c', display: 'block', marginBottom: 2 }}>Product SKU</span>
                    <span style={{ fontStyle: 'italic' }}>{product.sku}</span>
                  </div>
                )}
                <div>
                  <span style={{ color: '#7e818c', display: 'block', marginBottom: 2 }}>Care Instructions</span>
                  <span style={{ fontWeight: 700 }}>Dry clean only</span>
                </div>
              </div>

              {product.description && (
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #f5f5f6' }}>
                  <span style={{ color: '#7e818c', display: 'block', marginBottom: 4, fontSize: '13px' }}>Product Description</span>
                  <p style={{ fontSize: '13px', color: '#525252', lineHeight: 1.6 }}>{product.description}</p>
                </div>
              )}
            </div>

            {/* Trust Badges */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 30, padding: '12px 0', borderTop: '1px solid #eaeaec', borderBottom: '1px solid #eaeaec' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px', fontWeight: 700, color: '#7e818c' }}>
                <RefreshCw size={14} className="text-gray-500" />
                <span>EASY RETURNS</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px', fontWeight: 700, color: '#7e818c' }}>
                <ShieldCheck size={14} className="text-gray-500" />
                <span>100% GENUINE</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px', fontWeight: 700, color: '#7e818c' }}>
                <Truck size={14} className="text-gray-500" />
                <span>SECURE DELIVERY</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .product-detail-grid { grid-template-columns: 1fr !important; }
          .desktop-thumbnails { display: none !important; }
          .cta-flex { flex-direction: column !important; gap: 12px !important; }
        }
        @media (max-width: 480px) {
          .specs-grid { grid-template-columns: 1fr !important; gap: 10px !important; }
        }
      `}</style>

      {/* Buy Now checkout modal — single product checkout flow */}
      <PurchaseModal
        isOpen={buyNowOpen}
        onClose={() => setBuyNowOpen(false)}
        product={product ? { ...product, selectedSize, selectedColor: selectedColor?.name || '', quantity: qty } : null}
        isCartCheckout={false}
        onPurchaseSuccess={() => {}}
      />
    </ShopLayout>
  );
}
