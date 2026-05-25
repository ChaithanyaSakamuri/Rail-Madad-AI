import { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import api from '../services/api';
import { toast } from 'react-toastify';
import { Package, Truck, User, MapPin, Printer, Clipboard, Edit3, CheckSquare, Square, FileText } from 'lucide-react';

const FALLBACK_IMAGES = {
  'laptop pro': 'https://images.unsplash.com/photo-1496181130204-755241544e35?w=600&q=80',
  'wireless headphones': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
  'usb-c cable': 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600&q=80',
  'mechanical keyboard': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80',
  'external ssd': 'https://images.unsplash.com/photo-1597872200370-c53ece27e26c?w=600&q=80',
  'monitor 4k': 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&q=80',
  'mouse pad': 'https://images.unsplash.com/photo-1616440347437-b1c73416efc2?w=600&q=80',
  'webcam hd': 'https://images.unsplash.com/photo-1604754742629-3e5728249d73?w=600&q=80',
  'elegant floral cotton kurti': 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80',
  'premium silk cord-set': 'https://images.unsplash.com/photo-1608748010899-18f300247112?w=600&q=80',
  'embroidered three-piece partywear set': 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80',
  'classic cotton straight pants': 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&q=80',
  'super soft cotton leggings': 'https://images.unsplash.com/photo-1548624149-f7b31668831a?w=600&q=80',
  'oxidized silver jhumka earrings': 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&q=80'
};

export default function AdminPacking() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Packing checklist state
  const [packedItems, setPackedItems] = useState({});
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  
  // Printing states
  const [printType, setPrintType] = useState(null); // 'invoice' | 'slip' | 'label'

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Fetch all orders
      const res = await api.get('/orders');
      const allOrders = res.data.orders || [];
      
      // Group them (since backend returns individual sales, but we want grouped orders)
      // We can group sales by base order ID manually in frontend to keep it aligned
      const grouped = groupSalesFrontend(allOrders);
      
      // Filter confirmed, packing, packed, or ready_to_ship orders
      const packingOrders = grouped.filter(o => ['confirmed', 'packing', 'packed', 'ready_to_ship'].includes(o.status));
      
      setOrders(packingOrders);
      if (packingOrders.length > 0) {
        // Maintain selection or select first
        const currentSelected = selectedOrder 
          ? packingOrders.find(o => o.orderId === selectedOrder.orderId) 
          : null;
        selectOrder(currentSelected || packingOrders[0]);
      } else {
        setSelectedOrder(null);
      }
    } catch (err) {
      toast.error('Failed to load packing orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Helper to group orders on frontend
  const groupSalesFrontend = (sales) => {
    const map = new Map();
    for (const s of sales) {
      const baseId = s.orderId.split('-').slice(0, 3).join('-');
      if (!map.has(baseId)) {
        map.set(baseId, {
          orderId: baseId,
          customerName: s.customerName || 'Customer',
          customerEmail: s.customerEmail || '',
          customerPhone: s.customerPhone || '',
          shippingAddress: s.shippingAddress || '',
          pincode: s.pincode || '',
          city: s.city || '',
          state: s.state || '',
          notes: s.notes || '',
          paymentMethod: s.paymentMethod || 'Credit Card',
          paymentStatus: s.paymentStatus || 'unpaid',
          transactionId: s.transactionId || '',
          trackingId: s.trackingId || '',
          courierPartner: s.courierPartner || 'None',
          adminNotes: s.adminNotes || '',
          status: s.status || 'pending',
          createdAt: s.createdAt,
          items: [],
          totalAmount: 0,
          quantity: 0
        });
      }
      const grp = map.get(baseId);
      const getProductImage = (item) => {
        if (item.product?.image) return item.product.image;
        const key = (item.productName || '').trim().toLowerCase();
        return FALLBACK_IMAGES[key] || '';
      };

      grp.items.push({
        _id: s._id,
        productName: s.productName,
        quantity: s.quantity,
        unitPrice: s.unitPrice,
        discount: s.discount || 0,
        finalAmount: s.finalAmount,
        selectedSize: s.selectedSize || '',
        selectedColor: s.selectedColor || '',
        image: getProductImage(s)
      });
      grp.totalAmount += s.finalAmount;
      grp.quantity += s.quantity;
      // prioritize advanced status
      if (s.status === 'packing') grp.status = 'packing';
    }
    // Add delivery charge
    for (const g of map.values()) {
      g.totalAmount += 120; // Flat Delivery Charge
    }
    return Array.from(map.values());
  };

  const selectOrder = (order) => {
    setSelectedOrder(order);
    setAdminNotes(order.adminNotes || '');
    // Reset packed checkboxes - auto-check if already packed, ready to ship, or shipped
    const initialPacked = {};
    order.items.forEach(item => {
      initialPacked[item._id] = ['packed', 'ready_to_ship', 'shipped'].includes(order.status);
    });
    setPackedItems(initialPacked);
  };

  const toggleItemPacked = (itemId) => {
    setPackedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const allItemsChecked = () => {
    if (!selectedOrder) return false;
    return selectedOrder.items.every(item => packedItems[item._id]);
  };

  const updateOrderStatus = async (status, extraPayload = {}) => {
    if (!selectedOrder) return;
    setUpdating(true);
    try {
      // Loop through items in order to update their backend status
      // In backend, PUT /orders/:id/status updates the whole group, so we only need to call it once for the first item!
      const firstItem = selectedOrder.items[0];
      const payload = { 
        status, 
        adminNotes,
        ...extraPayload 
      };
      
      await api.put(`/orders/${firstItem._id}/status`, payload);
      toast.success(`Order status updated to ${status}`);
      await fetchOrders();
    } catch (err) {
      toast.error('Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const saveNotes = async () => {
    if (!selectedOrder) return;
    setUpdating(true);
    try {
      const firstItem = selectedOrder.items[0];
      await api.put(`/orders/${firstItem._id}/status`, { adminNotes });
      toast.success('Internal notes updated');
      // Update local state notes
      setSelectedOrder(prev => ({ ...prev, adminNotes }));
    } catch {
      toast.error('Failed to save notes');
    } finally {
      setUpdating(false);
    }
  };

  const handlePrint = (type) => {
    setPrintType(type);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Helper to render readable payment method
  const getPayMethodLabel = (m) => {
    if (m === 'UPI QR Code') return 'UPI Payment';
    return m;
  };

  return (
    <AdminLayout>
      <div className="admin-page-container" style={{ padding: 32, minHeight: '90vh', position: 'relative' }}>
        
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Packing Workstation 📦</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Scan items, verify quantities, and prepare packages for shipping.</p>
        </div>

        {loading ? (
          <div className="skeleton" style={{ height: 400, borderRadius: 'var(--radius-lg)' }} />
        ) : orders.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--neutral-100)', padding: '80px 24px', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>All caught up!</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No orders are currently waiting to be packed.</p>
          </div>
        ) : (
          <div className="admin-split-grid" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>
            
            {/* Orders Sidebar List */}
            <div className="admin-packing-sidebar" style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--neutral-100)', padding: 16, boxShadow: 'var(--shadow-sm)', maxHeight: '70vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--neutral-100)', paddingBottom: 10 }}>
                Queue ({orders.length})
              </h3>
              {orders.map(order => {
                const isSel = selectedOrder?.orderId === order.orderId;
                return (
                  <div
                    key={order.orderId}
                    onClick={() => selectOrder(order)}
                    style={{
                      padding: 12,
                      borderRadius: 'var(--radius-md)',
                      border: isSel ? '1px solid var(--rose-200)' : '1px solid var(--neutral-100)',
                      background: isSel ? 'var(--cream-50)' : '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--rose-700)', fontFamily: 'monospace' }}>{order.orderId}</span>
                      <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: order.status === 'packing' ? '#e0f2fe' : '#f5f5f5', color: order.status === 'packing' ? '#0369a1' : '#737373', fontWeight: 600, textTransform: 'uppercase' }}>
                        {order.status}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{order.customerName}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{order.items.length} items · ₹{order.totalAmount.toLocaleString()}</p>
                  </div>
                );
              })}
            </div>

            {/* Selected Order Packing Workbench */}
            {selectedOrder && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--neutral-100)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
                  
                  {/* Workbench Title */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--neutral-100)', paddingBottom: 16, marginBottom: 20 }}>
                    <div>
                      <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                        Workbench: <span style={{ fontFamily: 'monospace', color: 'var(--rose-700)' }}>{selectedOrder.orderId}</span>
                      </h3>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        Payment: <strong style={{ color: 'var(--rose-600)' }}>{getPayMethodLabel(selectedOrder.paymentMethod)}</strong> ({selectedOrder.paymentStatus})
                      </p>
                    </div>
                    
                    {/* Status change actions */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      {selectedOrder.status === 'confirmed' && (
                        <button
                          onClick={() => updateOrderStatus('packing')}
                          disabled={updating}
                          className="btn-primary"
                          style={{ padding: '8px 16px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, background: '#0284c7', borderColor: '#0284c7' }}
                        >
                          <Edit3 size={14} /> Start Packing
                        </button>
                      )}
                      {selectedOrder.status === 'packing' && (
                        <button
                          onClick={() => updateOrderStatus('packed')}
                          disabled={updating || !allItemsChecked()}
                          className="btn-primary"
                          style={{
                            padding: '8px 16px',
                            fontSize: 12,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            background: allItemsChecked() ? 'var(--rose-700)' : '#d4d5d9',
                            borderColor: allItemsChecked() ? 'var(--rose-700)' : '#d4d5d9',
                            cursor: allItemsChecked() ? 'pointer' : 'not-allowed'
                          }}
                        >
                          <Package size={14} /> Mark as Packed
                        </button>
                      )}
                      {selectedOrder.status === 'packed' && (
                        <button
                          onClick={() => {
                            const partner = window.prompt('Enter Courier Partner Name (Delhivery, Shiprocket, Blue Dart, DTDC, Indian Post):', 'Indian Post');
                            if (partner === null) return;
                            updateOrderStatus('ready_to_ship', { courierPartner: partner });
                          }}
                          disabled={updating}
                          className="btn-primary"
                          style={{ padding: '8px 16px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, background: '#059669', borderColor: '#059669' }}
                        >
                          <Truck size={14} /> Generate Parcel Label
                        </button>
                      )}
                      {selectedOrder.status === 'ready_to_ship' && (
                        <button
                          onClick={() => {
                            const partnerLabel = selectedOrder.courierPartner || 'Indian Post';
                            const tracking = window.prompt(`Enter Tracking / Consignment ID for ${partnerLabel}:`, selectedOrder.trackingId || '');
                            if (tracking === null) return;
                            updateOrderStatus('shipped', { 
                              trackingId: tracking,
                              dispatchDate: new Date().toISOString()
                            });
                          }}
                          disabled={updating}
                          className="btn-primary"
                          style={{ padding: '8px 16px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, background: '#8b5cf6', borderColor: '#8b5cf6' }}
                        >
                          <Truck size={14} /> Post / Ship Order
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="admin-double-row" style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 24 }}>
                    
                    {/* Left: Items Checklist */}
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <CheckSquare size={16} className="text-rose-600" /> Items Checklist (Check off after placing in box)
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {selectedOrder.items.map(item => {
                          const isPacked = packedItems[item._id];
                          return (
                            <div
                              key={item._id}
                              onClick={() => toggleItemPacked(item._id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: 12,
                                border: '1px solid var(--neutral-100)',
                                borderRadius: 'var(--radius-md)',
                                background: isPacked ? 'rgba(5, 150, 105, 0.03)' : '#fff',
                                borderColor: isPacked ? 'rgba(5, 150, 105, 0.2)' : 'var(--neutral-100)',
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                              }}
                            >
                              <div style={{ flexShrink: 0, color: isPacked ? '#059669' : '#d4d5d9' }}>
                                {isPacked ? <CheckSquare size={20} /> : <Square size={20} />}
                              </div>
                              {item.image ? (
                                <img src={item.image} alt="" style={{ width: 44, height: 54, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
                              ) : (
                                <div style={{ width: 44, height: 54, borderRadius: 4, background: 'var(--cream-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>👗</div>
                              )}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', textDecoration: isPacked ? 'line-through' : 'none', opacity: isPacked ? 0.6 : 1 }}>
                                  {item.productName}
                                </p>
                                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                                  Qty: <strong style={{ color: 'var(--rose-700)', fontSize: 12 }}>{item.quantity}</strong>
                                  {item.selectedSize && ` · Size: ${item.selectedSize}`}
                                  {item.selectedColor && ` · Color: ${item.selectedColor}`}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right: Customer Info & Internal Notes */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {/* Customer Card */}
                      <div style={{ background: 'var(--cream-50)', border: '1px solid var(--neutral-100)', borderRadius: 'var(--radius-md)', padding: 16 }}>
                        <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          <User size={14} className="text-rose-600" /> Customer & Ship To
                        </h4>
                        <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <p><strong>Name:</strong> {selectedOrder.customerName}</p>
                          <p><strong>Phone:</strong> {selectedOrder.customerPhone || 'Not provided'}</p>
                          <p><strong>Email:</strong> {selectedOrder.customerEmail || 'Not provided'}</p>
                          <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                            <MapPin size={14} className="text-gray-400 shrink-0 mt-0.5" />
                            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                              {selectedOrder.shippingAddress}<br />
                              {selectedOrder.city}, {selectedOrder.state} - <strong>{selectedOrder.pincode}</strong>
                            </p>
                          </div>
                          {selectedOrder.notes && (
                            <div style={{ marginTop: 10, padding: 8, background: '#fff', borderRadius: 4, borderLeft: '3px solid var(--rose-600)', fontSize: 11, color: 'var(--text-muted)' }}>
                              <strong>Cust. Notes:</strong> "{selectedOrder.notes}"
                            </div>
                          )}
                          {(selectedOrder.courierPartner || selectedOrder.trackingId) && (
                            <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px dashed var(--neutral-200)', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {selectedOrder.courierPartner && selectedOrder.courierPartner !== 'None' && (
                                <p><strong>Courier:</strong> {selectedOrder.courierPartner}</p>
                              )}
                              {selectedOrder.trackingId && (
                                <p>
                                  <strong>Consignment/AWB:</strong>{' '}
                                  <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--rose-700)' }}>
                                    {selectedOrder.trackingId}
                                  </span>
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Admin Internal Notes */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Clipboard size={14} className="text-rose-600" /> Internal Notes (Admin only)
                        </label>
                        <textarea
                          placeholder="Add details about packaging, special instructions, custom cards..."
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          style={{ width: '100%', minHeight: 70, border: '1px solid var(--neutral-200)', borderRadius: 6, padding: '8px 10px', fontSize: 12, outline: 'none', resize: 'none' }}
                        />
                        <button
                          onClick={saveNotes}
                          disabled={updating}
                          style={{ alignSelf: 'flex-end', background: '#fff', border: '1px solid var(--neutral-200)', padding: '6px 12px', fontSize: 11, fontWeight: 'bold', borderRadius: 6, cursor: 'pointer', transition: 'all 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--rose-300)'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--neutral-200)'}
                        >
                          Save Notes
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* Print Document Utilities bar */}
                  <div style={{ borderTop: '1px solid var(--neutral-100)', marginTop: 24, paddingTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', marginRight: 8 }}>PRINTERS:</span>
                    <button
                      onClick={() => handlePrint('invoice')}
                      style={{ background: '#fff', border: '1px solid var(--neutral-200)', borderRadius: 6, padding: '8px 14px', fontSize: 12, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                    >
                      <Printer size={13} /> Print Invoice
                    </button>
                    <button
                      onClick={() => handlePrint('slip')}
                      style={{ background: '#fff', border: '1px solid var(--neutral-200)', borderRadius: 6, padding: '8px 14px', fontSize: 12, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                    >
                      <Printer size={13} /> Print Packing Slip
                    </button>
                    <button
                      onClick={() => handlePrint('label')}
                      style={{ background: '#fff', border: '1px solid var(--neutral-200)', borderRadius: 6, padding: '8px 14px', fontSize: 12, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                    >
                      <Printer size={13} /> Print Shipping Label
                    </button>
                  </div>

                </div>
              </div>
            )}

          </div>
        )}

        {/* ─── PRINT HIDDEN SECTION (STYLING OVERRIDES @MEDIA PRINT) ─── */}
        {printType && selectedOrder && (
          <div id="print-area" style={{ display: 'none' }}>
            
            {/* INVOICE TEMPLATE */}
            {printType === 'invoice' && (
              <div style={{ padding: 40, color: '#000', background: '#fff', fontFamily: 'Arial, sans-serif' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: 20, marginBottom: 20 }}>
                  <div>
                    <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, textTransform: 'uppercase' }}>DEEPYA COLLECTIONS</h1>
                    <p style={{ fontSize: 12, margin: '4px 0 0 0' }}>Plot 42, Vasanth Nagar, KPHB Colony, Hyderabad, 500072</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <h2 style={{ fontSize: 18, fontWeight: 'bold', margin: 0 }}>TAX INVOICE</h2>
                    <p style={{ fontSize: 12, margin: '4px 0 0 0' }}>Order ID: <strong>{selectedOrder.orderId}</strong></p>
                    <p style={{ fontSize: 12, margin: '2px 0 0 0' }}>Date: {new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginBottom: 30, fontSize: 12 }}>
                  <div>
                    <h3 style={{ borderBottom: '1px solid #ccc', pb: 4, margin: '0 0 8px 0', fontSize: 13 }}>SOLD BY</h3>
                    <p><strong>DEEPYA COLLECTIONS</strong></p>
                    <p>GSTIN: 36ABCDE1234F1Z5 (Mock)</p>
                    <p>Email: deepyacollections@gmail.com</p>
                  </div>
                  <div>
                    <h3 style={{ borderBottom: '1px solid #ccc', pb: 4, margin: '0 0 8px 0', fontSize: 13 }}>BILL TO / SHIP TO</h3>
                    <p><strong>{selectedOrder.customerName}</strong></p>
                    <p>{selectedOrder.shippingAddress}</p>
                    <p>{selectedOrder.city}, {selectedOrder.state} - {selectedOrder.pincode}</p>
                    <p>Phone: {selectedOrder.customerPhone}</p>
                  </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 20 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #000', background: '#f5f5f5', textAlign: 'left' }}>
                      <th style={{ padding: 8 }}>Item Description</th>
                      <th style={{ padding: 8, textAlign: 'center' }}>Size</th>
                      <th style={{ padding: 8, textAlign: 'center' }}>Color</th>
                      <th style={{ padding: 8, textAlign: 'right' }}>Price</th>
                      <th style={{ padding: 8, textAlign: 'center' }}>Qty</th>
                      <th style={{ padding: 8, textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map(item => (
                      <tr key={item._id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: 8 }}>{item.productName}</td>
                        <td style={{ padding: 8, textAlign: 'center' }}>{item.selectedSize || '-'}</td>
                        <td style={{ padding: 8, textAlign: 'center' }}>{item.selectedColor || '-'}</td>
                        <td style={{ padding: 8, textAlign: 'right' }}>₹{item.unitPrice.toLocaleString()}</td>
                        <td style={{ padding: 8, textAlign: 'center' }}>{item.quantity}</td>
                        <td style={{ padding: 8, textAlign: 'right' }}>₹{item.finalAmount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ marginLeft: 'auto', width: '300px', fontSize: 12, borderTop: '2px solid #000', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Subtotal:</span>
                    <span>₹{(selectedOrder.totalAmount - 120).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Delivery Charge:</span>
                    <span>₹120</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: 14, borderTop: '1px solid #ccc', paddingTop: 6 }}>
                    <span>Grand Total:</span>
                    <span>₹{selectedOrder.totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                <div style={{ marginTop: 60, textAlign: 'center', borderTop: '1px solid #eee', paddingTop: 20, fontSize: 11, color: '#666' }}>
                  Thank you for shopping with DEEPYA COLLECTIONS! For support, email deepyacollections@gmail.com
                </div>
              </div>
            )}

            {/* PACKING SLIP TEMPLATE */}
            {printType === 'slip' && (
              <div style={{ padding: 40, color: '#000', background: '#fff', fontFamily: 'Arial, sans-serif' }}>
                <h1 style={{ fontSize: 22, fontWeight: 'bold', margin: '0 0 6px 0', textTransform: 'uppercase', textAlign: 'center' }}>PACKING CHECKLIST</h1>
                <p style={{ fontSize: 12, margin: '0 0 20px 0', textAlign: 'center', color: '#666' }}>Ref: {selectedOrder.orderId} · Date: {new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                
                <div style={{ border: '1px solid #000', padding: 15, borderRadius: 4, marginBottom: 20, fontSize: 12 }}>
                  <p><strong>Customer:</strong> {selectedOrder.customerName} ({selectedOrder.customerPhone})</p>
                  <p style={{ marginTop: 4 }}><strong>Address:</strong> {selectedOrder.shippingAddress}, {selectedOrder.city}, {selectedOrder.state} - {selectedOrder.pincode}</p>
                  {selectedOrder.notes && <p style={{ marginTop: 4, color: '#c2410c' }}><strong>Cust. Instructions:</strong> "{selectedOrder.notes}"</p>}
                  {selectedOrder.adminNotes && <p style={{ marginTop: 4, color: '#0369a1' }}><strong>Packaging Notes:</strong> "{selectedOrder.adminNotes}"</p>}
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #000', textAlign: 'left' }}>
                      <th style={{ padding: 8, width: 60 }}>Status</th>
                      <th style={{ padding: 8 }}>Item Details</th>
                      <th style={{ padding: 8, textAlign: 'center', width: 80 }}>Qty Ordered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map(item => (
                      <tr key={item._id} style={{ borderBottom: '1px solid #ccc', height: 50 }}>
                        <td style={{ padding: 8, fontSize: 18 }}>[  ]</td>
                        <td style={{ padding: 8 }}>
                          <strong style={{ fontSize: 13 }}>{item.productName}</strong>
                          <p style={{ fontSize: 11, color: '#555', margin: '2px 0 0 0' }}>
                            Size: {item.selectedSize || 'Free Size'} {item.selectedColor && ` · Color: ${item.selectedColor}`}
                          </p>
                        </td>
                        <td style={{ padding: 8, textAlign: 'center', fontWeight: 'bold', fontSize: 14 }}>{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ marginTop: 100, borderTop: '1px dashed #000', paddingTop: 20, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span>Packed By: ________________________</span>
                  <span>Signature: ________________________</span>
                </div>
              </div>
            )}

            {/* SHIPPING LABEL TEMPLATE */}
            {printType === 'label' && (
              <div style={{ width: '400px', border: '3px solid #000', padding: 20, color: '#000', background: '#fff', fontFamily: 'Arial, sans-serif', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #000', paddingBottom: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 16, fontWeight: 'black', letterSpacing: '0.05em' }}>DEEPYA COLLECTIONS</span>
                  <span style={{ fontSize: 11, border: '1.5px solid #000', padding: '2px 6px', fontWeight: 'bold' }}>
                    {selectedOrder.paymentMethod === 'Cash on Delivery' ? 'COD' : 'PREPAID'}
                  </span>
                </div>

                <div style={{ fontSize: 11, marginBottom: 12 }}>
                  <span style={{ display: 'block', fontSize: 9, color: '#666', fontWeight: 'bold' }}>SHIP TO:</span>
                  <strong style={{ fontSize: 13, display: 'block', margin: '2px 0' }}>{selectedOrder.customerName}</strong>
                  <span style={{ display: 'block', fontSize: 11, lineHeight: '1.3' }}>
                    {selectedOrder.shippingAddress}<br />
                    {selectedOrder.city}, {selectedOrder.state}<br />
                    <strong>PIN: {selectedOrder.pincode}</strong>
                  </span>
                  <span style={{ display: 'block', marginTop: 4 }}>Phone: <strong>{selectedOrder.customerPhone}</strong></span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '2px solid #000', paddingTop: 10 }}>
                  <div style={{ fontSize: 10 }}>
                    <p style={{ margin: 0 }}>Order ID: <strong>{selectedOrder.orderId}</strong></p>
                    <p style={{ margin: '2px 0 0 0' }}>Courier: <strong>{selectedOrder.courierPartner !== 'None' ? selectedOrder.courierPartner : 'Indian Post'}</strong></p>
                    <p style={{ margin: '2px 0 0 0', fontSize: 12 }}>Amount: <strong>₹{selectedOrder.totalAmount.toLocaleString()}</strong></p>
                  </div>
                  <div>
                    {/* Render order ID barcode using qrserver */}
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(selectedOrder.orderId)}`}
                      alt="Order Barcode QR"
                      style={{ width: 75, height: 75 }}
                    />
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

      </div>
      
      {/* Print styling overrides injection */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #print-area, #print-area * {
            visibility: visible !important;
          }
          #print-area {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: #fff !important;
          }
        }
      `}</style>

    </AdminLayout>
  );
}
