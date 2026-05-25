import { useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CartContext } from '../context/CartContext';
import { ProductImage } from './PurchaseModal';
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight, TrendingDown } from 'lucide-react';

const CartDrawer = ({ isOpen, onClose, onCheckout }) => {
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    cartCount,
    cartTotal,
    cartDiscountTotal,
    cartFinalTotal
  } = useContext(CartContext);

  const DELIVERY = 120;
  const grandTotal = cartFinalTotal + DELIVERY;

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, overflow: 'hidden' }}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)' }}
          />

          {/* Drawer Panel — slides from RIGHT */}
          <div style={{ position: 'fixed', inset: 0, display: 'flex', justifyContent: 'flex-end', pointerEvents: 'none' }}>
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 240 }}
              style={{ width: '100%', maxWidth: 420, pointerEvents: 'auto' }}
            >
              <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#fff', borderLeft: '1px solid #eaeaec', boxShadow: '-8px 0 40px rgba(0,0,0,.12)' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid #eaeaec', background: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ background: '#ffe6eb', color: '#ff3f6c', padding: 8, borderRadius: 6, display: 'flex' }}>
                      <ShoppingBag size={18} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: 14, fontWeight: 800, color: '#282c3f', letterSpacing: '.06em', textTransform: 'uppercase', margin: 0 }}>YOUR BAG</h2>
                      <p style={{ fontSize: 11, color: '#7e818c', margin: 0, marginTop: 2 }}>{cartCount} {cartCount === 1 ? 'item' : 'items'} in bag</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7e818c', padding: 6, borderRadius: '50%', display: 'flex', transition: 'all .15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f5f5f6'; e.currentTarget.style.color = '#282c3f'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#7e818c'; }}
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Items List */}
                <div style={{ flex: 1, overflowY: 'auto', padding: 14, background: '#f5f5f6', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {cartItems.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 40, background: '#fff', borderRadius: 4, border: '1px solid #eaeaec' }}>
                      <div style={{ width: 64, height: 64, background: '#f5f5f6', border: '1px solid #eaeaec', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, color: '#9496a0' }}>
                        <ShoppingBag size={30} />
                      </div>
                      <h3 style={{ fontSize: 15, fontWeight: 800, color: '#282c3f', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>Hey, it feels light!</h3>
                      <p style={{ fontSize: 12, color: '#7e818c', lineHeight: 1.5 }}>Nothing in your bag. Add some beautiful styles!</p>
                    </div>
                  ) : (
                    cartItems.map((item) => {
                      const finalPrice = item.price * (1 - (item.discount || 0) / 100);
                      const originalTotal = item.price * item.quantity;
                      const discountedTotal = finalPrice * item.quantity;

                      return (
                        <motion.div
                          layout
                          key={`${item._id}-${item.selectedSize}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          style={{ display: 'flex', gap: 12, background: '#fff', border: '1px solid #eaeaec', padding: 12, borderRadius: 4, position: 'relative' }}
                        >
                          {/* Thumbnail */}
                          <div style={{ width: 64, height: 80, flexShrink: 0, overflow: 'hidden', background: '#f5f5f6', border: '1px solid #eaeaec', borderRadius: 2 }}>
                            <ProductImage src={item.image} alt={item.name} category={item.category} />
                          </div>

                          {/* Details */}
                          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <span style={{ fontSize: 10, color: '#ff3f6c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>{item.category || 'Women'}</span>
                                <button
                                  onClick={() => removeFromCart(item._id)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7e818c', padding: 2, display: 'flex' }}
                                  onMouseEnter={e => e.currentTarget.style.color = '#ff3f6c'}
                                  onMouseLeave={e => e.currentTarget.style.color = '#7e818c'}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                              <h4 style={{ fontSize: 12, fontWeight: 700, color: '#282c3f', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</h4>
                              <p style={{ fontSize: 11, color: '#7e818c', marginTop: 3, fontWeight: 600 }}>
                                Size: {item.selectedSize || 'Free'}
                                {item.selectedColor ? ` | ${item.selectedColor}` : ''}
                              </p>
                            </div>

                            {/* Qty + Price row */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                              {/* Qty stepper */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f5f5f6', border: '1px solid #eaeaec', borderRadius: 2, padding: '2px 4px' }}>
                                <button
                                  onClick={() => updateQuantity(item._id, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                  style={{ background: 'none', border: 'none', cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer', color: '#7e818c', opacity: item.quantity <= 1 ? 0.3 : 1, display: 'flex', padding: 2 }}
                                >
                                  <Minus size={11} />
                                </button>
                                <span style={{ width: 18, textAlign: 'center', fontWeight: 800, fontSize: 12, color: '#282c3f' }}>{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item._id, item.quantity + 1)}
                                  disabled={item.quantity >= (item.stock || 10)}
                                  style={{ background: 'none', border: 'none', cursor: item.quantity >= (item.stock||10) ? 'not-allowed' : 'pointer', color: '#7e818c', opacity: item.quantity >= (item.stock||10) ? 0.3 : 1, display: 'flex', padding: 2 }}
                                >
                                  <Plus size={11} />
                                </button>
                              </div>

                              {/* Price */}
                              <div style={{ textAlign: 'right' }}>
                                {item.discount > 0 && (
                                  <span style={{ display: 'block', fontSize: 10, color: '#9496a0', textDecoration: 'line-through' }}>₹{originalTotal.toLocaleString()}</span>
                                )}
                                <span style={{ fontSize: 13, fontWeight: 800, color: '#282c3f' }}>₹{Math.round(discountedTotal).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>

                {/* Summary Footer */}
                {cartItems.length > 0 && (
                  <div style={{ padding: 20, borderTop: '1px solid #eaeaec', background: '#fff' }}>
                    <h4 style={{ fontSize: 11, fontWeight: 800, color: '#282c3f', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>
                      PRICE DETAILS ({cartCount} Items)
                    </h4>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#7e818c' }}>
                        <span>Total MRP</span>
                        <span style={{ fontWeight: 600, color: '#282c3f' }}>₹{cartTotal.toLocaleString()}</span>
                      </div>

                      {cartDiscountTotal > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#03a685', fontWeight: 700, alignItems: 'center' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <TrendingDown size={13} /> Discount on MRP
                          </span>
                          <span>−₹{cartDiscountTotal.toLocaleString()}</span>
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#7e818c' }}>
                        <span>Delivery Charges</span>
                        <span style={{ fontWeight: 600, color: '#282c3f' }}>₹{DELIVERY}</span>
                      </div>

                      <div style={{ borderTop: '1px solid #eaeaec', paddingTop: 10, marginTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#282c3f' }}>Total Amount</span>
                        <span style={{ fontSize: 18, fontWeight: 900, color: '#ff3f6c' }}>₹{grandTotal.toLocaleString()}</span>
                      </div>
                    </div>

                    <button
                      onClick={onCheckout}
                      style={{ width: '100%', marginTop: 16, background: '#ff3f6c', color: '#fff', fontWeight: 800, fontSize: 13, letterSpacing: '.08em', textTransform: 'uppercase', padding: '14px 20px', border: 'none', borderRadius: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background .15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#e0355c'}
                      onMouseLeave={e => e.currentTarget.style.background = '#ff3f6c'}
                    >
                      PROCEED TO CHECKOUT
                      <ArrowRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
