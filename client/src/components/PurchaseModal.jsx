import { useState, useEffect, useContext } from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { CartContext } from '../context/CartContext';
import {
  X, Minus, Plus, Truck, Phone, FileText,
  CheckCircle2, ShoppingBag, Package, Copy, PartyPopper, Sparkles
} from 'lucide-react';

/* ─── Shared product image with color fallback ─── */
export const ProductImage = ({ src, alt, category }) => {
  const [err, setErr] = useState(false);
  const colors = {
    'Cord-Sets': '#ff3f6c', Kurtis: '#8b5cf6',
    'Partywear (Three-Piece Set)': '#f59e0b',
    Leggings: '#10b981', 'Straight Pants': '#3b82f6', default: '#7e818c'
  };
  const bg = colors[category] || colors.default;
  if (err || !src) {
    return (
      <div style={{ width: '100%', height: '100%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 800, borderRadius: 4 }}>
        {alt ? alt.substring(0, 2).toUpperCase() : 'DC'}
      </div>
    );
  }
  return <img src={src} alt={alt} onError={() => setErr(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }} />;
};

/* ─── Field label wrapper ─── */
const Field = ({ label, icon: Icon, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <label style={{ fontSize: 11, fontWeight: 700, color: '#282c3f', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}>
      {Icon && <Icon size={12} color="#ff3f6c" />}
      {label}
    </label>
    {children}
  </div>
);

const inputSt = {
  width: '100%', padding: '9px 12px', border: '1px solid #d4d5d9', borderRadius: 2,
  fontSize: 12, color: '#282c3f', outline: 'none', background: '#fff',
  boxSizing: 'border-box', fontFamily: 'inherit'
};

/* ════════════════════════════════════════════════════ */
const PurchaseModal = ({ isOpen, onClose, product, isCartCheckout = false, onPurchaseSuccess }) => {
  const { cartItems, clearCart, cartFinalTotal, cartTotal, cartDiscountTotal, removeFromCart } = useContext(CartContext);

  const [quantity, setQuantity] = useState(1);
  const [phone, setPhone]       = useState('');
  const [address, setAddress]   = useState('');
  const [pincode, setPincode]   = useState('');
  const [city, setCity]         = useState('');
  const [state, setState]       = useState('');
  const [notes, setNotes]       = useState('');
  const [txnId, setTxnId]       = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess]   = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [error, setError]       = useState('');
  const [purchased, setPurchased] = useState([]);
  const [copied, setCopied]     = useState(false);
  const [step, setStep]         = useState(1); // 1=address  2=payment

  useEffect(() => {
    if (isOpen) {
      setQuantity(1); setPhone(''); setAddress(''); setPincode('');
      setCity(''); setState(''); setNotes(''); setTxnId('');
      setIsLoading(false); setSuccess(false); setOrderResult(null);
      setError(''); setPurchased([]); setStep(1);
    }
  }, [isOpen]);

  if (!isOpen) return null;
  if (!isCartCheckout && !product) return null;
  if (isCartCheckout && cartItems.length === 0 && !success) return null;

  const DELIVERY   = 120;
  const subtotal   = isCartCheckout ? cartTotal   : (product ? quantity * product.price : 0);
  const discount   = isCartCheckout ? cartDiscountTotal : subtotal * ((product?.discount || 0) / 100);
  const finalTotal = (isCartCheckout ? cartFinalTotal : subtotal - discount) + DELIVERY;

  /* ─── Step 1 validation ─── */
  const goToPayment = () => {
    if (!phone.trim())                                        { setError('Phone number is required'); return; }
    if (!address.trim() || address.trim().length < 15)        { setError('Enter full address (house no., street, landmark — min 15 chars)'); return; }
    if (!pincode.trim() || pincode.trim().length !== 6)       { setError('Enter valid 6-digit pincode'); return; }
    if (!city.trim())                                         { setError('City is required'); return; }
    if (!state.trim())                                        { setError('State is required'); return; }
    setError(''); setStep(2);
  };

  /* ─── Place order ─── */
  const placeOrder = async () => {
    if (!txnId.trim() || txnId.trim().length < 12) { setError('Enter valid 12-digit UTR / Transaction ID'); return; }
    setError(''); setIsLoading(true);
    try {
      if (isCartCheckout) {
        const res = await api.post('/products/checkout', {
          items: cartItems.map(i => ({
            productId: i._id, quantity: i.quantity,
            selectedSize: i.selectedSize || 'Free Size', selectedColor: i.selectedColor || ''
          })),
          phone, address, pincode, city, state, notes,
          paymentMethod: 'UPI QR Code', transactionId: txnId,
        });
        setOrderResult(res.data); setPurchased([...cartItems]); clearCart();
        if (onPurchaseSuccess) onPurchaseSuccess(res.data.sales || res.data.products);
      } else {
        const res = await api.post(`/products/${product._id}/buy`, {
          quantity, phone, address, pincode, city, state, notes,
          paymentMethod: 'UPI QR Code', transactionId: txnId,
          selectedSize: product.selectedSize || 'Free Size',
          selectedColor: product.selectedColor || '',
        });
        setOrderResult(res.data.sale); setPurchased([{ ...product, quantity }]);
        if (onPurchaseSuccess) onPurchaseSuccess([res.data.sale]);
      }
      setSuccess(true);
    } catch (err) {
      const msg = err.response?.data?.message || 'Order failed. Please try again.';
      setError(msg);
      if (msg.includes('not found') && msg.includes('Product with ID')) {
        const m = msg.match(/Product with ID ([a-f0-9]+) not found/i);
        if (m?.[1]) { removeFromCart(m[1]); setError('Some items are no longer available and were removed. Please retry.'); }
      }
    } finally { setIsLoading(false); }
  };

  const copyOrder = (id) => {
    navigator.clipboard.writeText(id).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const orderId = orderResult?.orderId || '—';

  /* ══════════════ SUCCESS SCREEN ══════════════ */
  if (success) {
    return (
      <AnimatePresence>
        <m.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'radial-gradient(ellipse at center, rgba(16,185,129,.15) 0%, rgba(0,0,0,.88) 70%)' }}
        >
          <m.div
            initial={{ scale: .5, opacity: 0, y: 60 }} animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 260 }}
            style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 4, boxShadow: '0 25px 60px rgba(0,0,0,.3)', overflow: 'hidden' }}
          >
            <div style={{ height: 4, background: 'linear-gradient(90deg,#ff3f6c,#ff905a)' }} />
            <div style={{ padding: '36px 32px', textAlign: 'center' }}>
              {/* Animated check */}
              <m.div
                initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 12, stiffness: 200, delay: .15 }}
                style={{ position: 'relative', display: 'inline-block', marginBottom: 20 }}
              >
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#e6f6f2', border: '2px solid #03a685', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={44} color="#03a685" />
                </div>
                <m.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: .5, type: 'spring' }}
                  style={{ position: 'absolute', top: -4, right: -4, width: 28, height: 28, borderRadius: '50%', background: '#ffe6eb', border: '2px solid #ff3f6c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <PartyPopper size={14} color="#ff3f6c" />
                </m.div>
              </m.div>

              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#282c3f', marginBottom: 4 }}>Order Placed! 🎉</h2>
              <p style={{ fontSize: 13, color: '#7e818c', marginBottom: 24 }}>Payment under verification. We'll dispatch soon!</p>

              {/* Order ID */}
              <div style={{ background: '#ffe6eb', border: '1px solid rgba(255,63,108,.2)', borderRadius: 4, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left' }}>
                  <Package size={16} color="#ff3f6c" />
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#7e818c', textTransform: 'uppercase', letterSpacing: '.06em' }}>Order ID</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#ff3f6c', fontFamily: 'monospace' }}>{orderId}</div>
                  </div>
                </div>
                <button onClick={() => copyOrder(orderId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7e818c', padding: 4 }}>
                  {copied ? <CheckCircle2 size={16} color="#03a685" /> : <Copy size={16} />}
                </button>
              </div>

              {/* Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                <div style={{ background: '#f5f5f6', borderRadius: 4, padding: 10, textAlign: 'left' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#7e818c', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 2 }}>Items</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#282c3f' }}>
                    {purchased.length === 1
                      ? `${purchased[0]?.name || purchased[0]?.product?.name} (x${purchased[0]?.quantity})`
                      : `${purchased.length} products`}
                  </div>
                </div>
                <div style={{ background: '#f5f5f6', borderRadius: 4, padding: 10, textAlign: 'left' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#7e818c', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 2 }}>Payment</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#282c3f' }}>UPI QR Code</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eaeaec', paddingTop: 12, marginBottom: 20 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#7e818c' }}>TOTAL PAID</span>
                <span style={{ fontSize: 22, fontWeight: 800, color: '#ff3f6c' }}>&#8377;{finalTotal.toLocaleString()}</span>
              </div>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fffde6', border: '1px solid rgba(230,125,74,.2)', borderRadius: 20, padding: '6px 14px', marginBottom: 20 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff905a', display: 'inline-block' }} />
                <span style={{ fontSize: 11, color: '#e67d4a', fontWeight: 600 }}>Pending — Admin verifying payment</span>
              </div>

              <button onClick={onClose} style={{ width: '100%', background: '#ff3f6c', color: '#fff', fontWeight: 700, fontSize: 13, letterSpacing: '.08em', textTransform: 'uppercase', padding: 14, border: 'none', borderRadius: 2, cursor: 'pointer', display: 'block' }}>
                Continue Shopping
              </button>
            </div>
          </m.div>
        </m.div>
      </AnimatePresence>
    );
  }

  /* ══════════════ CHECKOUT MODAL ══════════════ */
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(3px)' }} />

      {/* Modal */}
      <m.div
        initial={{ opacity: 0, scale: .94, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="checkout-modal-panel"
        style={{ position: 'relative', width: '100%', maxWidth: 680, maxHeight: '92vh', background: '#fff', borderRadius: 4, boxShadow: '0 30px 80px rgba(0,0,0,.25)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
      >
        {/* Pink top bar */}
        <div style={{ height: 3, background: 'linear-gradient(90deg,#ff3f6c,#ff905a)', flexShrink: 0 }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #eaeaec', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShoppingBag size={16} color="#ff3f6c" />
            <span style={{ fontSize: 14, fontWeight: 800, color: '#282c3f', letterSpacing: '.05em', textTransform: 'uppercase' }}>
              {step === 1 ? 'Checkout — Delivery Details' : 'Checkout — UPI Payment'}
            </span>
          </div>
          {/* Step pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {[1, 2].map(s => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: step >= s ? '#ff3f6c' : '#eaeaec', color: step >= s ? '#fff' : '#7e818c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>{s}</div>
                {s < 2 && <div style={{ width: 20, height: 2, background: step > s ? '#ff3f6c' : '#eaeaec' }} />}
              </div>
            ))}
            <button onClick={onClose} style={{ marginLeft: 10, background: 'none', border: 'none', cursor: 'pointer', color: '#7e818c', display: 'flex', padding: 4 }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: 20, flex: 1 }}>
          {/* Error */}
          {error && (
            <div style={{ background: '#ffe6eb', border: '1px solid rgba(255,63,108,.3)', color: '#ff3f6c', padding: '10px 14px', borderRadius: 4, fontSize: 12, fontWeight: 600, marginBottom: 16 }}>
              &#9888; {error}
            </div>
          )}

          {/* ── STEP 1: Address ── */}
          {step === 1 && (
            <div className="checkout-grid">

              {/* Order summary */}
              <div style={{ background: '#f5f5f6', border: '1px solid #eaeaec', borderRadius: 4, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <h4 style={{ fontSize: 11, fontWeight: 800, color: '#7e818c', textTransform: 'uppercase', letterSpacing: '.06em' }}>Order Summary</h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
                  {isCartCheckout ? cartItems.map(item => {
                    const dp = item.price * (1 - (item.discount || 0) / 100);
                    return (
                      <div key={item._id + (item.selectedSize || '')} style={{ display: 'flex', gap: 10, background: '#fff', border: '1px solid #eaeaec', borderRadius: 4, padding: 8 }}>
                        <div style={{ width: 40, height: 50, flexShrink: 0, borderRadius: 4, overflow: 'hidden' }}>
                          <ProductImage src={item.image} alt={item.name} category={item.category} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#282c3f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                          <div style={{ fontSize: 10, color: '#7e818c' }}>{item.selectedSize ? 'Size: ' + item.selectedSize + ' · ' : ''}Qty: {item.quantity}</div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#282c3f' }}>&#8377;{(dp * item.quantity).toFixed(0)}</div>
                        </div>
                      </div>
                    );
                  }) : product ? (
                    <div style={{ display: 'flex', gap: 10, background: '#fff', border: '1px solid #eaeaec', borderRadius: 4, padding: 8 }}>
                      <div style={{ width: 44, height: 56, flexShrink: 0, borderRadius: 4, overflow: 'hidden' }}>
                        <ProductImage src={product.image} alt={product.name} category={product.category} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, color: '#ff3f6c', fontWeight: 700, textTransform: 'uppercase' }}>{product.category}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#282c3f' }}>{product.name}</div>
                        {product.selectedSize && <div style={{ fontSize: 10, color: '#7e818c' }}>Size: {product.selectedSize}</div>}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                          <button type="button" onClick={() => setQuantity(q => Math.max(1, q - 1))} style={{ width: 22, height: 22, border: '1px solid #d4d5d9', background: '#fff', borderRadius: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={10} /></button>
                          <span style={{ fontSize: 12, fontWeight: 700 }}>{quantity}</span>
                          <button type="button" onClick={() => setQuantity(q => Math.min(product.stock || 10, q + 1))} style={{ width: 22, height: 22, border: '1px solid #d4d5d9', background: '#fff', borderRadius: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={10} /></button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Pricing */}
                <div style={{ borderTop: '1px solid #eaeaec', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#7e818c' }}>
                    <span>Subtotal (MRP)</span>
                    <span style={{ fontWeight: 700, color: '#282c3f' }}>&#8377;{subtotal.toLocaleString()}</span>
                  </div>
                  {discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#03a685', fontWeight: 700 }}>
                      <span>Discount</span><span>&#8722;&#8377;{discount.toFixed(0)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#7e818c' }}>
                    <span>Delivery</span>
                    <span style={{ fontWeight: 700, color: '#282c3f' }}>&#8377;{DELIVERY}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #eaeaec', paddingTop: 8, marginTop: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#282c3f', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Sparkles size={13} color="#ff905a" /> Total
                    </span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: '#ff3f6c' }}>&#8377;{finalTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Address form */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Field label="Phone Number *" icon={Phone}>
                  <input type="tel" placeholder="10-digit mobile number" value={phone} onChange={e => setPhone(e.target.value)} style={inputSt} />
                </Field>
                <Field label="House No., Street, Landmark *" icon={Truck}>
                  <textarea placeholder="E.g. H.No 12-3, Silk Lane, Near Temple" value={address} onChange={e => setAddress(e.target.value)} style={{ ...inputSt, minHeight: 64, resize: 'vertical' }} />
                </Field>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <Field label="Pincode *">
                    <input type="text" maxLength={6} placeholder="6-digit" value={pincode} onChange={e => setPincode(e.target.value.replace(/\D/g, '').substring(0, 6))} style={{ ...inputSt, fontFamily: 'monospace', letterSpacing: '.08em' }} />
                  </Field>
                  <Field label="City *">
                    <input type="text" placeholder="City" value={city} onChange={e => setCity(e.target.value)} style={inputSt} />
                  </Field>
                  <Field label="State *">
                    <input type="text" placeholder="State" value={state} onChange={e => setState(e.target.value)} style={inputSt} />
                  </Field>
                </div>
                <Field label="Delivery Notes (optional)" icon={FileText}>
                  <input type="text" placeholder="E.g. Leave with neighbour" value={notes} onChange={e => setNotes(e.target.value)} style={inputSt} />
                </Field>
              </div>
            </div>
          )}

          {/* ── STEP 2: UPI Payment ── */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Amount banner */}
              <div style={{ background: 'linear-gradient(135deg, #ff3f6c 0%, #ff905a 100%)', borderRadius: 6, padding: '14px 20px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, opacity: .85, textTransform: 'uppercase', letterSpacing: '.06em' }}>Amount to Pay</div>
                  <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-.5px' }}>&#8377;{finalTotal.toLocaleString()}</div>
                  <div style={{ fontSize: 10, opacity: .75 }}>incl. &#8377;{DELIVERY} delivery</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: 11, opacity: .85 }}>
                  <div>{isCartCheckout ? cartItems.length + ' item(s)' : quantity + ' item(s)'}</div>
                  <div style={{ marginTop: 2 }}>{phone}</div>
                </div>
              </div>

              {/* Instructions */}
              <div style={{ background: '#fffde6', border: '1px solid rgba(230,125,74,.25)', borderRadius: 4, padding: '12px 14px', fontSize: 12, color: '#e67d4a' }}>
                <div style={{ fontWeight: 800, fontSize: 10, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>📋 UPI Payment Steps</div>
                <ol style={{ paddingLeft: 16, margin: 0, lineHeight: 1.9 }}>
                  <li>Scan the QR code with GPay, PhonePe, Paytm, or BHIM.</li>
                  <li>Pay exactly <strong style={{ color: '#ff3f6c', fontSize: 13 }}>&#8377;{finalTotal.toLocaleString()}</strong> (including delivery).</li>
                  <li>Copy the 12-digit UTR from your UPI app and paste below.</li>
                </ol>
              </div>

              {/* QR code */}
              <div style={{ background: '#fff', border: '2px solid #eaeaec', borderRadius: 8, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <img src="/qr.jpg" alt="UPI QR Code" style={{ width: 200, height: 200, objectFit: 'contain', border: '1px solid #eaeaec', borderRadius: 4, padding: 6, background: '#fff' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f5f5f6', border: '1px solid #eaeaec', borderRadius: 4, padding: '8px 12px' }}>
                  <span style={{ fontSize: 11, color: '#7e818c', fontWeight: 700 }}>UPI ID:</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#ff3f6c', fontFamily: 'monospace' }}>paytm.s200o2c@pty</span>
                  <button type="button" onClick={() => navigator.clipboard.writeText('paytm.s200o2c@pty')} style={{ background: '#ff3f6c', color: '#fff', border: 'none', borderRadius: 3, padding: '3px 8px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>COPY</button>
                </div>
              </div>

              {/* UTR input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: '#282c3f', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  UPI Transaction ID (UTR) *
                </label>
                <input
                  type="text" maxLength={12}
                  placeholder="Enter 12-digit UTR number from your UPI app"
                  value={txnId}
                  onChange={e => setTxnId(e.target.value.replace(/\D/g, '').substring(0, 12))}
                  style={{ ...inputSt, textAlign: 'center', fontFamily: 'monospace', fontSize: 16, letterSpacing: '.15em', padding: 12, border: '2px solid ' + (txnId.length === 12 ? '#03a685' : '#d4d5d9') }}
                />
                {txnId.length > 0 && txnId.length < 12 && (
                  <span style={{ fontSize: 11, color: '#ff905a' }}>{txnId.length}/12 digits entered</span>
                )}
                {txnId.length === 12 && (
                  <span style={{ fontSize: 11, color: '#03a685', fontWeight: 700 }}>&#10003; UTR looks good!</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: 12, padding: '14px 20px', borderTop: '1px solid #eaeaec', background: '#fff', flexShrink: 0 }}>
          {step === 1 ? (
            <>
              <button type="button" onClick={onClose} style={{ flex: '0 0 100px', border: '1px solid #d4d5d9', background: '#fff', color: '#282c3f', fontWeight: 700, fontSize: 12, padding: 12, borderRadius: 2, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                Cancel
              </button>
              <button type="button" onClick={goToPayment} style={{ flex: 1, background: '#ff3f6c', color: '#fff', fontWeight: 700, fontSize: 13, padding: 12, border: 'none', borderRadius: 2, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '.08em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                Continue to Payment &#8594;
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => { setStep(1); setError(''); }} style={{ flex: '0 0 100px', border: '1px solid #d4d5d9', background: '#fff', color: '#282c3f', fontWeight: 700, fontSize: 12, padding: 12, borderRadius: 2, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                &#8592; Back
              </button>
              <button type="button" onClick={placeOrder} disabled={isLoading} style={{ flex: 1, background: isLoading ? '#d4d5d9' : '#ff3f6c', color: '#fff', fontWeight: 700, fontSize: 13, padding: 12, border: 'none', borderRadius: 2, cursor: isLoading ? 'not-allowed' : 'pointer', textTransform: 'uppercase', letterSpacing: '.08em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {isLoading ? (
                  <>
                    <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }} />
                    Processing...
                  </>
                ) : (
                  '&#10003; Confirm & Place Order'
                )}
              </button>
            </>
          )}
        </div>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @media (max-width: 768px) {
            .checkout-modal-panel {
              max-height: 96vh !important;
              border-radius: 12px !important;
            }
          }
        `}</style>
      </m.div>
    </div>
  );
};

export default PurchaseModal;
