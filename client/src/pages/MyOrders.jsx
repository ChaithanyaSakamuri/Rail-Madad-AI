import { useState, useEffect } from 'react';
import ShopLayout from '../layouts/ShopLayout';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const STATUS_STYLE = {
  pending:          { bg: '#fef9c3', color: '#a16207', label: '⏳ Awaiting Verification' },
  confirmed:        { bg: '#dbeafe', color: '#1d4ed8', label: '✅ Confirmed' },
  packing:          { bg: '#e0f2fe', color: '#0369a1', label: '📦 Packing' },
  packed:           { bg: '#ede9fe', color: '#6d28d9', label: '📦 Packed' },
  ready_to_ship:    { bg: '#f5f5f5', color: '#737373', label: '🚚 Ready to Ship' },
  shipped:          { bg: '#dcfce7', color: '#15803d', label: '🚚 Posted (Indian Post)' },
  out_for_delivery: { bg: '#ffedd5', color: '#c2410c', label: '🛵 Out for Delivery' },
  delivered:        { bg: '#dcfce7', color: '#15803d', label: '🎉 Delivered' },
  cancelled:        { bg: '#fee2e2', color: '#dc2626', label: '❌ Cancelled' },
  returned:         { bg: '#f3e8ff', color: '#7e22ce', label: '🔄 Returned' },
};

const getTrackingInfo = (partner, trackingId) => {
  const p = (partner || 'Indian Post').trim().toLowerCase();
  if (p.includes('delhivery')) {
    return {
      label: 'DELHIVERY TRACKING',
      emoji: '🚚',
      url: `https://www.delhivery.com/track/package/${trackingId}`,
      btnText: 'Track on Delhivery →'
    };
  }
  if (p.includes('shiprocket')) {
    return {
      label: 'SHIPROCKET TRACKING',
      emoji: '🚀',
      url: `https://track.shiprocket.in/?trkid=${trackingId}`,
      btnText: 'Track on Shiprocket →'
    };
  }
  if (p.includes('blue dart') || p.includes('bluedart')) {
    return {
      label: 'BLUE DART TRACKING',
      emoji: '✈️',
      url: `https://www.bluedart.com/web/guest/track-darts?trackId=${trackingId}`,
      btnText: 'Track on Blue Dart →'
    };
  }
  if (p.includes('dtdc')) {
    return {
      label: 'DTDC TRACKING',
      emoji: '📦',
      url: `https://www.dtdc.in/`,
      btnText: 'Track on DTDC →'
    };
  }
  return {
    label: 'INDIAN POST TRACKING',
    emoji: '🇮🇳',
    url: 'https://www.indiapost.gov.in/',
    btnText: 'Track on India Post →'
  };
};

export default function MyOrders() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    const fetch = async () => {
      try {
        const res = await api.get('/orders/my-orders');
        setOrders(res.data.orders || []);
      } catch {
        // empty
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [isAuthenticated, navigate]);

  return (
    <ShopLayout>
      <div className="page-container" style={{ padding: '40px 24px', minHeight: '60vh' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>My Orders</h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 32 }}>Track and manage your purchases</p>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 'var(--radius-lg)' }} />)}
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>📦</div>
            <h3 style={{ fontSize: 22, marginBottom: 8, color: 'var(--text-secondary)' }}>No orders yet</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>Time to find something you love!</p>
            <button onClick={() => navigate('/')} className="btn-primary">Start Shopping 🛍️</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {orders.map(order => {
              const sc = STATUS_STYLE[order.status] || STATUS_STYLE.pending;
              return (
                <div key={order._id} style={{ background: '#fff', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--neutral-100)', overflow: 'hidden' }}>
                  {/* Order header */}
                  <div style={{ background: 'var(--cream-100)', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 8 }}>ORDER</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--rose-700)', fontFamily: 'monospace' }}>{order.orderId}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 'var(--radius-full)', fontWeight: 600, background: sc.bg, color: sc.color }}>
                        {sc.label}
                      </span>
                    </div>
                  </div>
                  {/* Order body */}
                  <div style={{ padding: 20, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                    {order.product?.image && (
                      <img src={order.product.image} alt="" style={{ width: 70, height: 86, borderRadius: 'var(--radius-md)', objectFit: 'cover', flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.productName}</p>
                      <div style={{ display: 'flex', gap: 12, fontSize: 13, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                        <span>Qty: {order.quantity}</span>
                        {order.selectedSize && <span>Size: {order.selectedSize}</span>}
                        {order.selectedColor && <span>Color: {order.selectedColor}</span>}
                        <span>{order.paymentMethod}</span>
                      </div>
                      {order.trackingId && (() => {
                        const trackingInfo = getTrackingInfo(order.courierPartner, order.trackingId);
                        return (
                          <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--cream-100)', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-200)', display: 'inline-flex', flexDirection: 'column', gap: 4 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)' }}>{trackingInfo.emoji} {trackingInfo.label}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, flexWrap: 'wrap' }}>
                              <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--rose-700)' }}>
                                {order.courierPartner === 'Indian Post' || !order.courierPartner || order.courierPartner === 'None' ? 'Consignment: ' : 'AWB: '}
                                {order.trackingId}
                              </span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(order.trackingId);
                                  alert('Tracking ID copied to clipboard!');
                                }}
                                style={{ background: 'var(--rose-50)', color: 'var(--rose-700)', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 'bold', cursor: 'pointer' }}
                              >
                                Copy
                              </button>
                              <a
                                href={trackingInfo.url}
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: '#0284c7', textDecoration: 'underline', fontWeight: 'bold' }}
                              >
                                {trackingInfo.btnText}
                              </a>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--rose-700)' }}>₹{((order.finalAmount || 0) + (order.deliveryCharge || 0)).toLocaleString()}</p>
                      {order.discount > 0 && <p style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'line-through' }}>₹{(order.totalAmount || 0).toLocaleString()}</p>}
                      <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>Includes ₹{order.deliveryCharge || 0} delivery</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ShopLayout>
  );
}
