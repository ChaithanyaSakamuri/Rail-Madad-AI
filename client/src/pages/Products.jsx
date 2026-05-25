import { useState, useEffect, useRef, useCallback } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import api from '../services/api';
import { toast } from 'react-toastify';

const CATEGORIES = ['Cord-Sets', 'Kurtis', 'Partywear (Three-Piece Set)', 'Leggings', 'Straight Pants', 'Accessories', 'Other'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Free Size'];
const OCCASIONS = ['Casual', 'Formal', 'Party', 'Wedding', 'Festive', 'Office', 'Beach', 'Sport', 'Ethnic'];

const PlusIcon = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const EditIcon = () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const TrashIcon = () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>;
const UploadIcon = () => <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
const CloseIcon = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const SearchIcon = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;

const EMPTY_FORM = {
  name: '', description: '', price: '', originalPrice: '', discount: '0',
  category: 'Dresses', material: '', sku: '', stock: '', isFeatured: false,
  sizes: [], colors: [], occasion: [], tags: '',
};

function ImageUploader({ mainImage, setMainImage, extraImages, setExtraImages }) {
  const mainRef = useRef();
  const extraRef = useRef();
  const [dragging, setDragging] = useState(false);

  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ dataUrl: reader.result, file });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleMainFile = async (file) => {
    if (!file.type.startsWith('image/')) { toast.error('Only images allowed'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    const { dataUrl } = await toBase64(file);
    setMainImage({ preview: dataUrl, file });
  };

  const handleExtraFiles = async (files) => {
    const toAdd = [];
    for (const file of [...files].slice(0, 5 - extraImages.length)) {
      if (!file.type.startsWith('image/')) continue;
      const { dataUrl } = await toBase64(file);
      toAdd.push({ preview: dataUrl, file });
    }
    setExtraImages(prev => [...prev, ...toAdd].slice(0, 5));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Main image */}
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Main Product Image *</p>
        <div
          onClick={() => mainRef.current.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handleMainFile(e.dataTransfer.files[0]); }}
          style={{
            border: `2px dashed ${dragging ? 'var(--rose-500)' : mainImage ? 'var(--rose-300)' : 'var(--neutral-300)'}`,
            borderRadius: 'var(--radius-lg)', background: dragging ? 'var(--rose-50)' : mainImage ? 'transparent' : 'var(--neutral-50)',
            cursor: 'pointer', overflow: 'hidden', position: 'relative', transition: 'all 0.2s',
            minHeight: mainImage ? 'auto' : 160, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
          {mainImage ? (
            <>
              <img src={mainImage.preview} alt="Main" style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }} />
              <button
                onClick={e => { e.stopPropagation(); setMainImage(null); }}
                style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CloseIcon />
              </button>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
              <UploadIcon />
              <p style={{ fontSize: 14, marginTop: 12, fontWeight: 500 }}>Drop image here or click to browse</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>PNG, JPG, WEBP — Max 5MB</p>
            </div>
          )}
        </div>
        <input ref={mainRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleMainFile(e.target.files[0])} />
      </div>

      {/* Extra images */}
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Gallery Images (up to 5)</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
          {extraImages.map((img, i) => (
            <div key={i} style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--neutral-100)' }}>
              <img src={img.preview} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} />
              <button onClick={() => setExtraImages(prev => prev.filter((_, j) => j !== i))}
                style={{ position: 'absolute', top: 3, right: 3, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CloseIcon />
              </button>
            </div>
          ))}
          {extraImages.length < 5 && (
            <button onClick={() => extraRef.current.click()} style={{ aspectRatio: '1', border: '2px dashed var(--neutral-300)', borderRadius: 'var(--radius-md)', background: 'var(--neutral-50)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 11 }}>
              <PlusIcon />Add
            </button>
          )}
        </div>
        <input ref={extraRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => handleExtraFiles(e.target.files)} />
      </div>
    </div>
  );
}

function ProductModal({ product, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [mainImage, setMainImage] = useState(null);
  const [extraImages, setExtraImages] = useState([]);
  const [colorInput, setColorInput] = useState({ name: '', hex: '#000000' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        originalPrice: product.originalPrice || '',
        discount: product.discount || '0',
        category: product.category || 'Dresses',
        material: product.material || '',
        sku: product.sku || '',
        stock: product.stock || '',
        isFeatured: product.isFeatured || false,
        sizes: product.sizes || [],
        colors: product.colors || [],
        occasion: product.occasion || [],
        tags: (product.tags || []).join(', '),
      });
      if (product.image) setMainImage({ preview: product.image, file: null });
    }
  }, [product]);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const toggleArr = (key, val) => {
    setForm(prev => ({
      ...prev,
      [key]: prev[key].includes(val) ? prev[key].filter(v => v !== val) : [...prev[key], val],
    }));
  };

  const addColor = () => {
    if (!colorInput.name.trim()) return;
    setForm(prev => ({ ...prev, colors: [...prev.colors, { name: colorInput.name.trim(), hex: colorInput.hex }] }));
    setColorInput({ name: '', hex: '#000000' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.stock) { toast.error('Name, price and stock are required'); return; }

    setLoading(true);
    try {
      const formData = new FormData();

      // Text fields
      Object.entries(form).forEach(([k, v]) => {
        if (Array.isArray(v)) formData.append(k, JSON.stringify(v));
        else if (typeof v === 'boolean') formData.append(k, v ? 'true' : 'false');
        else if (v !== '') formData.append(k, v);
      });
      // Tags
      formData.set('tags', JSON.stringify(form.tags.split(',').map(t => t.trim()).filter(Boolean)));

      // Images
      if (mainImage?.file) formData.append('image', mainImage.file);
      else if (mainImage?.preview && product?.image) formData.append('existingImage', product.image);

      extraImages.forEach(img => { if (img.file) formData.append('images', img.file); });

      let res;
      if (product?._id) {
        res = await api.put(`/products/${product._id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        res = await api.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      }

      toast.success(product ? 'Product updated! ✨' : 'Product added! 🎉');
      onSave(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px 16px', overflowY: 'auto', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#fff', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: 860, marginTop: 'auto', marginBottom: 'auto', boxShadow: 'var(--shadow-xl)', overflow: 'hidden' }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 32px', borderBottom: '1px solid var(--neutral-100)', background: 'linear-gradient(135deg, var(--rose-50), var(--cream-100))' }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
              {product ? 'Edit Product' : 'Add New Product'}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Fill in the details below</p>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--neutral-100)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: '32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
            {/* Left — Images */}
            <div>
              <ImageUploader mainImage={mainImage} setMainImage={setMainImage} extraImages={extraImages} setExtraImages={setExtraImages} />
            </div>

            {/* Right — Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', maxHeight: '70vh' }}>
              {/* Name */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>Product Name *</label>
                <input className="input-field" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Floral Anarkali Dress" required />
              </div>

              {/* Category */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>Category *</label>
                <select className="input-field" value={form.category} onChange={e => set('category', e.target.value)}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Price row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>Price (₹) *</label>
                  <input className="input-field" type="number" min="0" value={form.price} onChange={e => set('price', e.target.value)} placeholder="0" required />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>Original (₹)</label>
                  <input className="input-field" type="number" min="0" value={form.originalPrice} onChange={e => set('originalPrice', e.target.value)} placeholder="0" />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>Discount %</label>
                  <input className="input-field" type="number" min="0" max="100" value={form.discount} onChange={e => set('discount', e.target.value)} placeholder="0" />
                </div>
              </div>

              {/* Stock + SKU */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>Stock *</label>
                  <input className="input-field" type="number" min="0" value={form.stock} onChange={e => set('stock', e.target.value)} placeholder="100" required />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>SKU</label>
                  <input className="input-field" value={form.sku} onChange={e => set('sku', e.target.value)} placeholder="ELN-001" />
                </div>
              </div>

              {/* Material */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>Material</label>
                <input className="input-field" value={form.material} onChange={e => set('material', e.target.value)} placeholder="Cotton, Silk, Georgette..." />
              </div>

              {/* Sizes */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 8 }}>Available Sizes</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {SIZES.map(s => (
                    <button type="button" key={s} onClick={() => toggleArr('sizes', s)}
                      style={{ padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 500, border: `1.5px solid ${form.sizes.includes(s) ? 'var(--rose-600)' : 'var(--neutral-200)'}`, background: form.sizes.includes(s) ? 'var(--rose-50)' : '#fff', color: form.sizes.includes(s) ? 'var(--rose-700)' : 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.15s' }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 8 }}>Colors</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                  {form.colors.map((c, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: 'var(--neutral-100)', borderRadius: 'var(--radius-full)', fontSize: 12 }}>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: c.hex || c.name, border: '1px solid rgba(0,0,0,0.1)' }} />
                      {c.name}
                      <button type="button" onClick={() => set('colors', form.colors.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14, padding: 0, lineHeight: 1 }}>×</button>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="text" className="input-field" value={colorInput.name} onChange={e => setColorInput(p => ({ ...p, name: e.target.value }))} placeholder="Color name" style={{ flex: 1 }} />
                  <input type="color" value={colorInput.hex} onChange={e => setColorInput(p => ({ ...p, hex: e.target.value }))} style={{ width: 44, height: 44, padding: 4, border: '1.5px solid var(--neutral-200)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }} />
                  <button type="button" onClick={addColor} style={{ padding: '0 16px', background: 'var(--rose-50)', border: '1.5px solid var(--rose-200)', borderRadius: 'var(--radius-md)', color: 'var(--rose-700)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Add</button>
                </div>
              </div>

              {/* Occasion */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 8 }}>Occasion</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {OCCASIONS.map(o => (
                    <button type="button" key={o} onClick={() => toggleArr('occasion', o)}
                      style={{ padding: '5px 12px', borderRadius: 'var(--radius-full)', fontSize: 12, fontWeight: 500, border: `1.5px solid ${form.occasion.includes(o) ? 'var(--rose-500)' : 'var(--neutral-200)'}`, background: form.occasion.includes(o) ? 'var(--rose-50)' : '#fff', color: form.occasion.includes(o) ? 'var(--rose-700)' : 'var(--text-secondary)', cursor: 'pointer' }}>
                      {o}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>Tags (comma-separated)</label>
                <input className="input-field" value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="floral, summer, ethnic, trendy" />
              </div>

              {/* Description */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>Description</label>
                <textarea className="input-field" rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe this beautiful piece..." style={{ resize: 'vertical' }} />
              </div>

              {/* Featured */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.isFeatured} onChange={e => set('isFeatured', e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--rose-600)' }} />
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>✨ Featured product (show in homepage highlights)</span>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: '20px 32px', borderTop: '1px solid var(--neutral-100)', display: 'flex', justifyContent: 'flex-end', gap: 12, background: 'var(--neutral-50)' }}>
            <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading} style={{ minWidth: 140 }}>
              {loading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Saving...</> : (product ? '✅ Save Changes' : 'Add Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteId, setDeleteId] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (search) params.append('search', search);
      if (filterCategory) params.append('category', filterCategory);
      const res = await api.get(`/products/admin/all?${params}`);
      setProducts(res.data.products || []);
      setTotalPages(res.data.pagination?.pages || 1);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterCategory]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { setPage(1); }, [search, filterCategory]);

  const handleSave = (saved) => {
    setProducts(prev => editing
      ? prev.map(p => p._id === saved._id ? saved : p)
      : [saved, ...prev]
    );
    setModalOpen(false);
    setEditing(null);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/products/${id}`);
      setProducts(prev => prev.filter(p => p._id !== id));
      toast.success('Product removed');
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleteId(null);
    }
  };

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (p) => { setEditing(p); setModalOpen(true); };

  return (
    <AdminLayout>
      <div style={{ padding: 32 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Products</h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Manage your boutique's inventory</p>
          </div>
          <button onClick={openAdd} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <PlusIcon /> Add Product
          </button>
        </div>

        {/* Filters */}
        <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--neutral-50)', borderRadius: 'var(--radius-full)', padding: '8px 16px', flex: 1, minWidth: 200, border: '1px solid var(--neutral-200)' }}>
            <SearchIcon />
            <input type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ background: 'none', border: 'none', fontSize: 14, color: 'var(--text-primary)', outline: 'none', width: '100%' }} />
          </div>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            style={{ padding: '9px 16px', borderRadius: 'var(--radius-full)', border: '1px solid var(--neutral-200)', background: '#fff', fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer', outline: 'none' }}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--neutral-50)', borderBottom: '1px solid var(--neutral-100)' }}>
                  {['Product', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '14px 16px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textAlign: 'left', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(6)].map((_, j) => (
                        <td key={j} style={{ padding: '16px' }}>
                          <div className="skeleton" style={{ height: 16, width: j === 0 ? 200 : 80 }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
                      <div style={{ fontSize: 40, marginBottom: 12 }}>👗</div>
                      <p style={{ fontSize: 15, fontWeight: 500 }}>No products yet</p>
                      <p style={{ fontSize: 13, marginTop: 4 }}>Add your first product to get started!</p>
                      <button onClick={openAdd} className="btn-primary" style={{ marginTop: 16 }}>Add Product</button>
                    </td>
                  </tr>
                ) : products.map(p => (
                  <tr key={p._id} style={{ borderBottom: '1px solid var(--neutral-50)', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--cream-50)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 52, height: 64, borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--cream-100)', flexShrink: 0 }}>
                          {p.image ? (
                            <img src={p.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>👗</div>
                          )}
                        </div>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                          {p.sku && <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>SKU: {p.sku}</p>}
                          {p.isFeatured && <span style={{ fontSize: 10, color: 'var(--gold-600)', fontWeight: 700 }}>✨ FEATURED</span>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className="badge badge-rose" style={{ fontSize: 11 }}>{p.category}</span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>₹{Math.round(p.price * (1 - (p.discount || 0) / 100)).toLocaleString()}</p>
                        {p.discount > 0 && <p style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'line-through' }}>₹{p.price.toLocaleString()}</p>}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: p.stock === 0 ? '#dc2626' : p.stock < 10 ? '#d97706' : '#16a34a' }}>
                        {p.stock === 0 ? 'Out' : p.stock < 10 ? `Low (${p.stock})` : p.stock}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className={`badge ${p.isActive ? 'badge-green' : 'badge-red'}`}>{p.isActive ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => openEdit(p)} style={{ padding: '7px', borderRadius: 'var(--radius-md)', background: 'var(--neutral-100)', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex' }}
                          title="Edit" onMouseEnter={e => e.currentTarget.style.background = 'var(--rose-50)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'var(--neutral-100)'}>
                          <EditIcon />
                        </button>
                        <button onClick={() => setDeleteId(p._id)} style={{ padding: '7px', borderRadius: 'var(--radius-md)', background: 'var(--neutral-100)', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex' }}
                          title="Delete" onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#dc2626'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'var(--neutral-100)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--neutral-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Page {page} of {totalPages}</p>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '7px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-200)', background: '#fff', fontSize: 13, cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}>Prev</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '7px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-200)', background: '#fff', fontSize: 13, cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}>Next</button>
              </div>
            </div>
          )}
        </div>

        {/* Product Modal */}
        {modalOpen && <ProductModal product={editing} onClose={() => { setModalOpen(false); setEditing(null); }} onSave={handleSave} />}

        {/* Delete Confirm */}
        {deleteId && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
            <div style={{ background: '#fff', borderRadius: 'var(--radius-xl)', padding: 32, maxWidth: 380, width: '90%', textAlign: 'center', boxShadow: 'var(--shadow-xl)' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🗑️</div>
              <h3 style={{ fontSize: 20, marginBottom: 8 }}>Delete Product?</h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>This action cannot be undone.</p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button onClick={() => setDeleteId(null)} className="btn-ghost">Cancel</button>
                <button onClick={() => handleDelete(deleteId)} style={{ padding: '11px 24px', background: '#dc2626', color: '#fff', borderRadius: 'var(--radius-full)', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
