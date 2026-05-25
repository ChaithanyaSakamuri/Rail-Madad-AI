import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ShopLayout from '../layouts/ShopLayout';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import { Heart, Star, SlidersHorizontal, ArrowUpDown, ChevronRight, X } from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
];

function ProductCard({ product, onAddToCart }) {
  const [liked, setLiked] = useState(false);
  const navigate = useNavigate();

  const discountedPrice = product.price * (1 - (product.discount || 0) / 100);

  return (
    <div className="product-card" style={{ 
      cursor: 'pointer',
      position: 'relative',
      background: '#ffffff',
      transition: 'all 0.2s',
    }}>
      {/* Image & Badges */}
      <div 
        style={{ position: 'relative', overflow: 'hidden', background: '#f5f5f6' }}
        onClick={() => navigate(`/product/${product._id}`)}
      >
        {product.image ? (
          <img 
            className="product-img" 
            src={product.image} 
            alt={product.name} 
            style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{ width: '100%', aspectRatio: '3/4', background: '#eaeaec', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>
            👗
          </div>
        )}
        
        {/* Wishlist Icon */}
        <button 
          onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}
          style={{ 
            position: 'absolute', 
            top: 10, 
            right: 10, 
            width: 32, 
            height: 32, 
            borderRadius: '50%', 
            background: '#ffffff', 
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: liked ? '#ff3f6c' : '#7e818c', 
            border: 'none',
            zIndex: 10,
            cursor: 'pointer'
          }}
        >
          <Heart size={15} fill={liked ? '#ff3f6c' : 'none'} />
        </button>

        {/* Rating Pill overlay (bottom left, Myntra style) */}
        {product.rating > 0 && (
          <div style={{ 
            position: 'absolute', 
            bottom: 8, 
            left: 8, 
            background: 'rgba(255, 255, 255, 0.9)', 
            padding: '3px 6px', 
            borderRadius: '2px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: 3, 
            fontSize: '11px',
            fontWeight: 700,
            color: '#282c3f',
            zIndex: 8,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <span>{product.rating.toFixed(1)}</span>
            <Star size={10} fill="#ff3f6c" stroke="none" />
            <span style={{ color: '#7e818c', fontWeight: 500, fontSize: '9px' }}>|</span>
            <span style={{ color: '#7e818c', fontWeight: 500 }}>{product.reviewCount || 12}</span>
          </div>
        )}

        {/* Size Selector Hover Overlay */}
        <div className="product-sizes-overlay" onClick={e => e.stopPropagation()}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#282c3f', marginBottom: 6, letterSpacing: '0.04em' }}>
            SELECT SIZE
          </p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
            {product.sizes?.length > 0 ? (
              product.sizes.map(size => (
                <button 
                  key={size}
                  onClick={() => onAddToCart(product, size)}
                  style={{
                    padding: '4px 6px',
                    border: '1px solid #d4d5d9',
                    background: '#ffffff',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#282c3f',
                    borderRadius: '50%',
                    width: 26,
                    height: 26,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#ff3f6c'; e.currentTarget.style.color = '#ff3f6c'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#d4d5d9'; e.currentTarget.style.color = '#282c3f'; }}
                >
                  {size[0]}
                </button>
              ))
            ) : (
              <button 
                onClick={() => onAddToCart(product, 'Free Size')}
                style={{
                  padding: '4px 8px',
                  border: '1px solid #d4d5d9',
                  background: '#ffffff',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#282c3f',
                  borderRadius: '10px',
                  transition: 'all 0.15s',
                  cursor: 'pointer'
                }}
              >
                FREE SIZE
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Info Details */}
      <div style={{ padding: '12px 10px 10px' }} onClick={() => navigate(`/product/${product._id}`)}>
        <h4 style={{ 
          fontSize: '14px', 
          fontWeight: 800, 
          color: '#282c3f', 
          letterSpacing: '0.03em', 
          textTransform: 'uppercase', 
          marginBottom: 2,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          DEEPYA COLLECTIONS
        </h4>
        <p style={{ 
          fontSize: '13px', 
          color: '#7e818c', 
          marginBottom: 6, 
          whiteSpace: 'nowrap', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis',
          fontWeight: 400
        }}>
          {product.name}
        </p>

        {/* Pricing */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#282c3f' }}>
            ₹{Math.round(discountedPrice).toLocaleString()}
          </span>
          {product.discount > 0 && (
            <>
              <span style={{ fontSize: '11px', color: '#7e818c', textDecoration: 'line-through' }}>
                ₹{product.price.toLocaleString()}
              </span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#ff905a' }}>
                ({product.discount}% OFF)
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StoreFront() {
  const { addItem } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('newest');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sizeFilter, setSizeFilter] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [cartOpen, setCartOpen] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 16, sort });
      if (category) params.append('category', category);
      if (search) params.append('search', search);
      if (sizeFilter) params.append('size', sizeFilter);
      if (priceRange.min) params.append('minPrice', priceRange.min);
      if (priceRange.max) params.append('maxPrice', priceRange.max);

      const res = await api.get(`/products?${params}`);
      setProducts(res.data.products || []);
      setTotalPages(res.data.pagination?.pages || 1);
    } catch {
      toast.error('Could not load products');
    } finally {
      setLoading(false);
    }
  }, [page, category, sort, search, sizeFilter, priceRange]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Read URL search params for category and search text
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('category');
    const srch = params.get('search');
    if (cat !== null) setCategory(cat);
    if (srch !== null) setSearch(srch);
  }, []);

  useEffect(() => { setPage(1); }, [category, sort, search, sizeFilter, priceRange]);

  const handleAddToCart = (product, size) => {
    addItem({ ...product, selectedSize: size });
    toast.success(
      <span>
        <b>{product.name}</b> (Size: {size}) added to bag!{' '}
        <span
          style={{ cursor: 'pointer', textDecoration: 'underline', fontWeight: 700 }}
          onClick={() => setCartOpen(true)}
        >
          VIEW BAG →
        </span>
      </span>,
      { autoClose: 3000 }
    );
  };

  return (
    <ShopLayout onSearch={setSearch} onCategoryChange={setCategory} activeCategory={category} cartOpenExternal={cartOpen} onCartOpenExternal={() => setCartOpen(false)}>
      
      {/* Clean Myntra Banner Section */}
      <div style={{ background: '#f5f5f6', padding: '40px 20px', borderBottom: '1px solid #eaeaec' }}>
        <div className="page-container" style={{ textAlign: 'left' }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: '12px', color: '#7e818c', marginBottom: 12 }}>
            <Link to="/" style={{ textDecoration: 'none' }}>Home</Link>
            <ChevronRight size={12} />
            <span style={{ color: '#282c3f', fontWeight: 700 }}>Women's Fashion Clothing</span>
          </div>
          
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#282c3f', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            DEEPYA COLLECTIONS Storefront
          </h2>
          <p style={{ fontSize: '13px', color: '#7e818c', marginTop: 4 }}>
            Browse {category ? category : "All Women's Collection"} styles — find cord-sets, kurtis, partywear and more.
          </p>
        </div>
      </div>

      {/* Catalog Main Layout */}
      <div className="page-container" style={{ padding: '32px 0 60px' }}>
        <div style={{ display: 'flex', gap: 30, alignItems: 'flex-start' }} className="catalog-flex">
          
          {/* Permanent Desktop Filters Sidebar */}
          <aside className="filters-sidebar" style={{ width: 230, flexShrink: 0, position: 'sticky', top: 120 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid #eaeaec', marginBottom: 20 }}>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#282c3f', letterSpacing: '0.05em' }}>FILTERS</span>
              {(sizeFilter || priceRange.min || priceRange.max || category) && (
                <button 
                  onClick={() => { setSizeFilter(''); setPriceRange({ min: '', max: '' }); setCategory(''); }} 
                  style={{ background: 'none', color: '#ff3f6c', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                >
                  CLEAR ALL
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #eaeaec' }}>
              <h5 style={{ fontSize: '13px', fontWeight: 700, color: '#282c3f', marginBottom: 12, textTransform: 'uppercase' }}>Categories</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['Cord-Sets', 'Kurtis', 'Partywear (Three-Piece Set)', 'Leggings', 'Straight Pants', 'Accessories', 'Other'].map(cat => {
                  const isChecked = category === cat;
                  return (
                    <label key={cat} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '13px', color: '#282c3f', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={() => setCategory(isChecked ? '' : cat)}
                        style={{ accentColor: '#ff3f6c', width: 14, height: 14 }}
                      />
                      <span>{cat}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Size Filter */}
            <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #eaeaec' }}>
              <h5 style={{ fontSize: '13px', fontWeight: 700, color: '#282c3f', marginBottom: 12, textTransform: 'uppercase' }}>Sizes</h5>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'].map(s => {
                  const isActive = sizeFilter === s;
                  return (
                    <button 
                      key={s} 
                      onClick={() => setSizeFilter(isActive ? '' : s)}
                      style={{ 
                        padding: '6px 10px', 
                        borderRadius: '2px', 
                        fontSize: '11px', 
                        fontWeight: 700, 
                        background: isActive ? '#ff3f6c' : '#ffffff', 
                        color: isActive ? '#ffffff' : '#282c3f', 
                        border: `1px solid ${isActive ? '#ff3f6c' : '#d4d5d9'}`,
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price Filter */}
            <div>
              <h5 style={{ fontSize: '13px', fontWeight: 700, color: '#282c3f', marginBottom: 12, textTransform: 'uppercase' }}>Price Range (₹)</h5>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input 
                  type="number" 
                  placeholder="Min" 
                  value={priceRange.min} 
                  onChange={e => setPriceRange(p => ({ ...p, min: e.target.value }))} 
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #d4d5d9', fontSize: '12px', color: '#282c3f', background: '#ffffff', borderRadius: '2px' }} 
                />
                <span style={{ color: '#7e818c' }}>to</span>
                <input 
                  type="number" 
                  placeholder="Max" 
                  value={priceRange.max} 
                  onChange={e => setPriceRange(p => ({ ...p, max: e.target.value }))} 
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #d4d5d9', fontSize: '12px', color: '#282c3f', background: '#ffffff', borderRadius: '2px' }} 
                />
              </div>
            </div>
          </aside>

          {/* Right Catalog Products Area */}
          <div style={{ flex: 1 }}>
            
            {/* Grid Toolbar: Sort selection */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: '1px solid #eaeaec', paddingBottom: 16 }}>
              <span style={{ fontSize: '13px', color: '#7e818c', fontWeight: 600 }}>
                {!loading && `${products.length} items found`}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '13px', color: '#7e818c' }}>Sort by:</span>
                <select 
                  value={sort} 
                  onChange={e => setSort(e.target.value)}
                  style={{ 
                    padding: '8px 14px', 
                    border: '1px solid #d4d5d9', 
                    background: '#fff', 
                    color: '#282c3f', 
                    fontSize: '13px', 
                    fontWeight: 700, 
                    cursor: 'pointer', 
                    outline: 'none',
                    borderRadius: '2px'
                  }}
                >
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="products-grid">
                {[...Array(8)].map((_, i) => (
                  <div key={i}>
                    <div className="skeleton" style={{ height: 280, borderRadius: '0px', marginBottom: 12 }} />
                    <div className="skeleton" style={{ height: 16, width: '40%', marginBottom: 6 }} />
                    <div className="skeleton" style={{ height: 14, width: '70%', marginBottom: 8 }} />
                    <div className="skeleton" style={{ height: 14, width: '30%' }} />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#7e818c' }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>👗</div>
                <h3 style={{ fontSize: 20, color: '#282c3f', fontWeight: 700, marginBottom: 8 }}>We couldn't find any matches</h3>
                <p style={{ fontSize: 13 }}>Try clearing filters or search terms to browse styles</p>
                <button 
                  onClick={() => { setCategory(''); setSearch(''); setSizeFilter(''); setPriceRange({ min: '', max: '' }); }} 
                  className="btn-primary" 
                  style={{ marginTop: 20 }}
                >
                  Browse All Collections
                </button>
              </div>
            ) : (
              <div className="products-grid">
                {products.map(p => <ProductCard key={p._id} product={p} onAddToCart={handleAddToCart} />)}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 50 }}>
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))} 
                  disabled={page === 1}
                  style={{ padding: '8px 16px', border: '1px solid #d4d5d9', borderRadius: '2px', background: '#fff', color: '#282c3f', fontSize: '13px', fontWeight: 700, cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}
                >
                  Prev
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button 
                    key={i} 
                    onClick={() => setPage(i + 1)}
                    style={{ 
                      width: 36, 
                      height: 36, 
                      borderRadius: '50%', 
                      border: 'none', 
                      background: page === i + 1 ? '#ff3f6c' : '#f5f5f6', 
                      color: page === i + 1 ? '#fff' : '#282c3f', 
                      fontWeight: 700, 
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    {i + 1}
                  </button>
                ))}
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                  disabled={page === totalPages}
                  style={{ padding: '8px 16px', border: '1px solid #d4d5d9', borderRadius: '2px', background: '#fff', color: '#282c3f', fontSize: '13px', fontWeight: 700, cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .filters-sidebar { display: none !important; }
          .catalog-flex { flex-direction: column !important; }
          .product-sizes-overlay { display: none !important; }
        }
      `}</style>
    </ShopLayout>
  );
}
