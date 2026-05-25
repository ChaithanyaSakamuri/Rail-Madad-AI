import { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import api from '../services/api';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Search, Download, Calendar, Filter, Eye, X, Check, Save } from 'lucide-react';

const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  packing: 'Packing',
  packed: 'Packed',
  ready_to_ship: 'Ready to Ship',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned'
};

const STATUS_STYLE = {
  pending:          { bg: '#fef9c3', color: '#a16207' },
  confirmed:        { bg: '#dbeafe', color: '#1d4ed8' },
  packing:          { bg: '#e0f2fe', color: '#0369a1' },
  packed:           { bg: '#ede9fe', color: '#6d28d9' },
  ready_to_ship:    { bg: '#f5f5f5', color: '#737373' },
  shipped:          { bg: '#dcfce7', color: '#15803d' },
  out_for_delivery: { bg: '#ffedd5', color: '#c2410c' },
  delivered:        { bg: '#dcfce7', color: '#16a34a' },
  cancelled:        { bg: '#fee2e2', color: '#dc2626' },
  returned:         { bg: '#f3e8ff', color: '#7e22ce' },
};

const COURIERS = ['Delhivery', 'Shiprocket', 'Blue Dart', 'DTDC', 'Indian Post', 'None'];

export default function AdminOrders() {
  const [allOrders, setAllOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [datePreset, setDatePreset] = useState(''); // 'today' | 'week' | 'month' | 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const limit = 10;

  // Selected Order for Detail Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Modal Edit states
  const [modalCourier, setModalCourier] = useState('None');
  const [modalTracking, setModalTracking] = useState('');
  const [modalPaymentStatus, setModalPaymentStatus] = useState('unpaid');
  const [modalDispatchDate, setModalDispatchDate] = useState('');
  const [modalEstDeliveryDate, setModalEstDeliveryDate] = useState('');
  const [modalAdminNotes, setModalAdminNotes] = useState('');
  const [savingOrder, setSavingOrder] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Fetch grouped orders directly from dashboard API
      const res = await api.get('/dashboard/admin/orders');
      setAllOrders(res.data || []);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter Logic
  useEffect(() => {
    let result = [...allOrders];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(o => 
        o.orderId.toLowerCase().includes(q) ||
        o.customerName?.toLowerCase().includes(q) ||
        o.customerEmail?.toLowerCase().includes(q) ||
        o.customerPhone?.toLowerCase().includes(q) ||
        o.items.some(i => i.productName.toLowerCase().includes(q))
      );
    }

    // Status Filter
    if (statusFilter) {
      result = result.filter(o => o.status === statusFilter);
    }

    // Payment Status Filter
    if (paymentStatusFilter) {
      result = result.filter(o => o.paymentStatus === paymentStatusFilter);
    }

    // Date Presets & Custom Dates
    const now = new Date();
    if (datePreset === 'today') {
      const todayStr = now.toDateString();
      result = result.filter(o => new Date(o.createdAt).toDateString() === todayStr);
    } else if (datePreset === 'week') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      result = result.filter(o => new Date(o.createdAt) >= sevenDaysAgo);
    } else if (datePreset === 'month') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      result = result.filter(o => new Date(o.createdAt) >= thirtyDaysAgo);
    } else if (datePreset === 'custom') {
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        result = result.filter(o => new Date(o.createdAt) >= start);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        result = result.filter(o => new Date(o.createdAt) <= end);
      }
    }

    setFilteredOrders(result);
    setPage(1); // reset to first page on filter
  }, [allOrders, search, statusFilter, paymentStatusFilter, datePreset, startDate, endDate]);

  // Paginated display
  const paginatedOrders = filteredOrders.slice((page - 1) * limit, page * limit);
  const totalPages = Math.ceil(filteredOrders.length / limit) || 1;

  // Open Details Modal
  const openDetails = (order) => {
    setSelectedOrder(order);
    setModalCourier(order.courierPartner || 'None');
    setModalTracking(order.trackingId || '');
    setModalPaymentStatus(order.paymentStatus || 'unpaid');
    setModalDispatchDate(order.dispatchDate ? new Date(order.dispatchDate).toISOString().split('T')[0] : '');
    setModalEstDeliveryDate(order.estimatedDeliveryDate ? new Date(order.estimatedDeliveryDate).toISOString().split('T')[0] : '');
    setModalAdminNotes(order.adminNotes || '');
  };

  // Quick Inline Status Update
  const updateStatus = async (order, newStatus) => {
    try {
      const firstItem = order.items[0];
      const payload = { status: newStatus };

      if (newStatus === 'ready_to_ship') {
        const partner = window.prompt('Enter Courier Partner Name (Delhivery, Shiprocket, Blue Dart, DTDC, Indian Post):', order.courierPartner || 'Indian Post');
        if (partner === null) return; // User cancelled
        payload.courierPartner = partner;
      } else if (newStatus === 'shipped') {
        let partner = order.courierPartner;
        if (!partner || partner === 'None') {
          partner = window.prompt('Enter Courier Partner Name (Delhivery, Shiprocket, Blue Dart, DTDC, Indian Post):', 'Indian Post');
          if (partner === null) return; // Cancelled
          payload.courierPartner = partner;
        }
        const tracking = window.prompt(`Enter Tracking / Consignment ID for ${partner}:`, order.trackingId || '');
        if (tracking === null) return; // Cancelled
        payload.trackingId = tracking;
        payload.dispatchDate = new Date().toISOString();
      }

      await api.put(`/orders/${firstItem._id}/status`, payload);
      
      // Update local state
      setAllOrders(prev => prev.map(o => {
        if (o.orderId === order.orderId) {
          return { 
            ...o, 
            status: newStatus,
            courierPartner: payload.courierPartner !== undefined ? payload.courierPartner : o.courierPartner,
            trackingId: payload.trackingId !== undefined ? payload.trackingId : o.trackingId,
            dispatchDate: payload.dispatchDate !== undefined ? payload.dispatchDate : o.dispatchDate
          };
        }
        return o;
      }));
      
      if (selectedOrder?.orderId === order.orderId) {
        setSelectedOrder(prev => ({ 
          ...prev, 
          status: newStatus,
          courierPartner: payload.courierPartner !== undefined ? payload.courierPartner : prev.courierPartner,
          trackingId: payload.trackingId !== undefined ? payload.trackingId : prev.trackingId,
          dispatchDate: payload.dispatchDate !== undefined ? payload.dispatchDate : prev.dispatchDate
        }));
      }
      
      toast.success(`Order status updated to ${STATUS_LABELS[newStatus]}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  // Save Modal Settings (Courier tracking, payment status)
  const saveModalDetails = async () => {
    if (!selectedOrder) return;
    setSavingOrder(true);
    try {
      const firstItem = selectedOrder.items[0];
      const payload = {
        courierPartner: modalCourier,
        trackingId: modalTracking,
        paymentStatus: modalPaymentStatus,
        adminNotes: modalAdminNotes,
        dispatchDate: modalDispatchDate ? new Date(modalDispatchDate) : null,
        estimatedDeliveryDate: modalEstDeliveryDate ? new Date(modalEstDeliveryDate) : null
      };

      const res = await api.put(`/orders/${firstItem._id}/status`, payload);
      
      // Update locally
      setAllOrders(prev => prev.map(o => {
        if (o.orderId === selectedOrder.orderId) {
          return { 
            ...o, 
            courierPartner: res.data.courierPartner,
            trackingId: res.data.trackingId,
            paymentStatus: res.data.paymentStatus,
            adminNotes: res.data.adminNotes,
            dispatchDate: res.data.dispatchDate,
            estimatedDeliveryDate: res.data.estimatedDeliveryDate
          };
        }
        return o;
      }));

      setSelectedOrder(prev => ({
        ...prev,
        courierPartner: res.data.courierPartner,
        trackingId: res.data.trackingId,
        paymentStatus: res.data.paymentStatus,
        adminNotes: res.data.adminNotes,
        dispatchDate: res.data.dispatchDate,
        estimatedDeliveryDate: res.data.estimatedDeliveryDate
      }));

      toast.success('Shipping & payment details saved!');
    } catch {
      toast.error('Failed to save order details');
    } finally {
      setSavingOrder(false);
    }
  };

  // EXCEL EXPORT
  const handleExcelExport = () => {
    if (filteredOrders.length === 0) {
      toast.warn('No order records to export');
      return;
    }
    const rows = filteredOrders.map(o => ({
      'Order ID': o.orderId,
      'Customer Name': o.customerName || 'N/A',
      'Phone': o.customerPhone || 'N/A',
      'Email': o.customerEmail || 'N/A',
      'Full Address': `${o.shippingAddress}, ${o.city}, ${o.state} - ${o.pincode}`,
      'Products': o.items.map(i => `${i.productName} (${i.selectedSize}/${i.selectedColor}) x${i.quantity}`).join('; '),
      'Quantity': o.quantity,
      'Total Amount': o.totalAmount,
      'Payment Status': o.paymentStatus,
      'Courier Status': o.status,
      'Courier Partner': o.courierPartner || 'N/A',
      'Tracking ID': o.trackingId || 'N/A',
      'Date': new Date(o.createdAt).toLocaleDateString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
    XLSX.writeFile(workbook, `DEEPYA_COLLECTIONS_Orders_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Excel sheet downloaded!');
  };

  // PDF EXPORT
  const handlePDFExport = () => {
    if (filteredOrders.length === 0) {
      toast.warn('No order records to export');
      return;
    }
    const doc = new jsPDF('landscape');
    doc.setFont('Helvetica', 'bold');
    doc.text('DEEPYA COLLECTIONS — Orders Export', 14, 15);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()} | Count: ${filteredOrders.length}`, 14, 22);

    const headers = [['Order ID', 'Customer Name', 'Address', 'Phone', 'Products', 'Total', 'Payment Status', 'Courier Status']];
    const dataRows = filteredOrders.map(o => [
      o.orderId || 'N/A',
      o.customerName || 'N/A',
      `${o.shippingAddress || ''}${o.city ? ', ' + o.city : ''}${o.state ? ', ' + o.state : ''}${o.pincode ? ' - ' + o.pincode : ''}` || 'N/A',
      o.customerPhone || 'N/A',
      (o.items || []).map(i => `${i.productName || 'N/A'} x${i.quantity || 1}`).join('\n'),
      `₹${o.totalAmount || 0}`,
      o.paymentStatus || 'N/A',
      o.status || 'N/A'
    ]);

    autoTable(doc, {
      head: headers,
      body: dataRows,
      startY: 28,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [26, 10, 20] } // matching deepya theme
    });

    doc.save(`Deepya_Orders_Export_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF report downloaded!');
  };

  return (
    <AdminLayout>
      <div className="admin-page-container" style={{ padding: 32 }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Order Management 📦</h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Manage payments, configure shipping parameters, and export order rosters.</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleExcelExport} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#16a34a', borderColor: '#16a34a', padding: '10px 16px', fontSize: 13 }}>
              <Download size={15} /> Export Excel
            </button>
            <button onClick={handlePDFExport} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#dc2626', borderColor: '#dc2626', padding: '10px 16px', fontSize: 13 }}>
              <Download size={15} /> Export PDF
            </button>
          </div>
        </div>

        {/* Filters Controls Panel */}
        <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--neutral-100)', padding: 20, marginBottom: 20, boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search by Order ID, name, phone, email, item..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-field"
                style={{ paddingLeft: 36, width: '100%' }}
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="input-field"
              style={{ width: 160 }}
            >
              <option value="">All Statuses</option>
              {Object.keys(STATUS_LABELS).map(k => <option key={k} value={k}>{STATUS_LABELS[k]}</option>)}
            </select>

            {/* Payment Status Filter */}
            <select
              value={paymentStatusFilter}
              onChange={e => setPaymentStatusFilter(e.target.value)}
              className="input-field"
              style={{ width: 180 }}
            >
              <option value="">All Payments</option>
              <option value="unpaid">Unpaid</option>
              <option value="pending_verification">Pending Verification</option>
              <option value="paid">Paid</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={14} /> Date range:</span>
            
            {/* Date preset selector buttons */}
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { key: '', label: 'All Time' },
                { key: 'today', label: 'Today' },
                { key: 'week', label: '7 Days' },
                { key: 'month', label: '30 Days' },
                { key: 'custom', label: 'Custom' },
              ].map(preset => (
                <button
                  key={preset.key}
                  onClick={() => setDatePreset(preset.key)}
                  style={{
                    background: datePreset === preset.key ? 'var(--cream-100)' : '#fff',
                    border: '1px solid var(--neutral-200)',
                    color: datePreset === preset.key ? 'var(--rose-700)' : 'var(--text-secondary)',
                    padding: '6px 12px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom Dates Inputs */}
            {datePreset === 'custom' && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input-field" style={{ padding: '4px 8px', fontSize: 11 }} />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>to</span>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input-field" style={{ padding: '4px 8px', fontSize: 11 }} />
              </div>
            )}
          </div>

        </div>

        {/* Orders Table */}
        <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--neutral-100)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--neutral-50)', borderBottom: '1px solid var(--neutral-100)' }}>
                  {['Order ID', 'Customer', 'Products', 'Grand Total', 'Payment', 'Date', 'Courier Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '13px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textAlign: 'left', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(8)].map((_, j) => (
                        <td key={j} style={{ padding: 16 }}>
                          <div className="skeleton" style={{ height: 14, width: 80 }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: 80, textAlign: 'center', color: 'var(--text-muted)' }}>
                      <p style={{ fontSize: 15, fontWeight: 500 }}>No matching order logs found.</p>
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map(order => {
                    const sc = STATUS_STYLE[order.status] || STATUS_STYLE.pending;
                    return (
                      <tr key={order.orderId} style={{ borderBottom: '1px solid var(--neutral-50)', transition: 'background 0.15s' }}>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--rose-700)', fontFamily: 'monospace' }}>{order.orderId}</span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{order.customerName}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{order.customerPhone}</p>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <p style={{ fontSize: 13, fontWeight: 500, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {order.items.map(i => `${i.productName} x${i.quantity}`).join(', ')}
                          </p>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--rose-700)' }}>₹{order.totalAmount.toLocaleString()}</p>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{order.paymentMethod}</span>
                          <span style={{ display: 'block', fontSize: 10, fontWeight: 600, textTransform: 'capitalize', color: order.paymentStatus === 'paid' ? '#16a34a' : '#d97706', marginTop: 2 }}>
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <select
                            value={order.status}
                            onChange={e => updateStatus(order, e.target.value)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: 6,
                              fontSize: 12,
                              background: sc.bg,
                              color: sc.color,
                              fontWeight: 600,
                              border: 'none',
                              outline: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            {Object.keys(STATUS_LABELS).map(k => <option key={k} value={k}>{STATUS_LABELS[k]}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <button
                            onClick={() => openDetails(order)}
                            style={{ background: 'none', border: 'none', color: 'var(--rose-600)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 'bold' }}
                          >
                            <Eye size={14} /> Details
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--neutral-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Showing {paginatedOrders.length} of {filteredOrders.length} orders (Page {page} of {totalPages})</p>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-primary" style={{ background: '#fff', border: '1px solid var(--neutral-200)', color: 'var(--text-primary)', padding: '6px 12px', opacity: page === 1 ? 0.5 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}>Prev</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-primary" style={{ background: '#fff', border: '1px solid var(--neutral-200)', color: 'var(--text-primary)', padding: '6px 12px', opacity: page === totalPages ? 0.5 : 1, cursor: page === totalPages ? 'not-allowed' : 'pointer' }}>Next</button>
              </div>
            </div>
          )}
        </div>

        {/* ─── ORDER DETAILS OVERLAY MODAL ─── */}
        {selectedOrder && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            {/* Backdrop */}
            <div onClick={() => setSelectedOrder(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} />
            
            {/* Modal Body */}
            <div className="admin-modal-body" style={{ position: 'relative', width: '100%', maxWidth: '850px', background: '#fff', borderRadius: 'var(--radius-lg)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
              
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--neutral-100)', background: 'var(--cream-50)' }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                    Order Details: <span style={{ fontFamily: 'monospace', color: 'var(--rose-700)' }}>{selectedOrder.orderId}</span>
                  </h3>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    Placed: {new Date(selectedOrder.createdAt).toLocaleString()}
                  </p>
                </div>
                <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="admin-modal-grid" style={{ padding: 24, overflowY: 'auto', flex: 1, display: 'grid', gridTemplateColumns: '4fr 3fr', gap: 24 }}>
                
                {/* Left Column: Items Breakdown */}
                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Items in Order</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                    {selectedOrder.items.map(item => (
                      <div key={item._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8, border: '1px solid var(--neutral-50)', borderRadius: 8 }}>
                        {item.image ? (
                          <img src={item.image} alt="" style={{ width: 44, height: 54, borderRadius: 4, objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: 44, height: 54, borderRadius: 4, background: 'var(--cream-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👗</div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{item.productName}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                            Size: {item.selectedSize || 'Free Size'} {item.selectedColor && ` · Color: ${item.selectedColor}`}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: 13, fontWeight: 700 }}>₹{item.finalAmount.toLocaleString()}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.quantity} x ₹{item.unitPrice}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary Totals */}
                  <div style={{ borderTop: '1px solid var(--neutral-100)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                      <span>Subtotal:</span>
                      <span>₹{(selectedOrder.totalAmount - 120).toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                      <span>Delivery Charges:</span>
                      <span>₹120</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 15, borderTop: '1px solid var(--neutral-100)', paddingTop: 8, color: 'var(--rose-700)' }}>
                      <span>Grand Total:</span>
                      <span>₹{selectedOrder.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Customer Info & Shipping Integrations */}
                <div className="admin-modal-details-col" style={{ display: 'flex', flexDirection: 'column', gap: 16, borderLeft: '1px solid var(--neutral-100)', paddingLeft: 20 }}>
                  
                  {/* Customer Information Section */}
                  <div>
                    <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Customer Details</h4>
                    <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <p><strong>Name:</strong> {selectedOrder.customerName}</p>
                      <p><strong>Phone:</strong> {selectedOrder.customerPhone || 'Not provided'}</p>
                      <p><strong>Email:</strong> {selectedOrder.customerEmail || 'Not provided'}</p>
                      <p style={{ fontSize: 12, lineHeight: 1.4, color: 'var(--text-secondary)', marginTop: 4 }}>
                        <strong>Address:</strong><br />
                        {selectedOrder.shippingAddress}<br />
                        {selectedOrder.city}, {selectedOrder.state} - <strong>{selectedOrder.pincode}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Payment Details Section */}
                  <div>
                    <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Payment Parameters</h4>
                    <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <p>Method: <strong>{selectedOrder.paymentMethod}</strong></p>
                      {selectedOrder.transactionId && <p>UTR Reference: <strong style={{ fontFamily: 'monospace', color: 'var(--rose-700)' }}>{selectedOrder.transactionId}</strong></p>}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>Status:</span>
                        <select
                          value={modalPaymentStatus}
                          onChange={e => setModalPaymentStatus(e.target.value)}
                          className="input-field"
                          style={{ padding: '2px 6px', fontSize: 12, width: 140 }}
                        >
                          <option value="unpaid">Unpaid</option>
                          <option value="pending_verification">Pending Verification</option>
                          <option value="paid">Paid</option>
                          <option value="refunded">Refunded</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Courier & Shipping Parameters Section */}
                  <div>
                    <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Parcel Shipping Integration</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      
                      {/* Courier Partner Selection */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <label style={{ fontSize: 10, fontWeight: 700 }}>COURIER PARTNER</label>
                        <select
                          value={modalCourier}
                          onChange={e => setModalCourier(e.target.value)}
                          className="input-field"
                          style={{ fontSize: 12, padding: '4px 8px' }}
                        >
                          {COURIERS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>

                      {/* Tracking ID input */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <label style={{ fontSize: 10, fontWeight: 700 }}>TRACKING / CONSIGNMENT ID</label>
                        <input
                          type="text"
                          placeholder="E.g., IE123456789IN"
                          value={modalTracking}
                          onChange={e => setModalTracking(e.target.value)}
                          className="input-field"
                          style={{ fontSize: 12, padding: '4px 8px' }}
                        />
                      </div>

                      {/* Dispatch & Estimated Dates */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <label style={{ fontSize: 9, fontWeight: 700 }}>DISPATCH DATE</label>
                          <input type="date" value={modalDispatchDate} onChange={e => setModalDispatchDate(e.target.value)} className="input-field" style={{ fontSize: 11, padding: '2px 4px' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <label style={{ fontSize: 9, fontWeight: 700 }}>EST DELIVERY DATE</label>
                          <input type="date" value={modalEstDeliveryDate} onChange={e => setModalEstDeliveryDate(e.target.value)} className="input-field" style={{ fontSize: 11, padding: '2px 4px' }} />
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Internal Admin Notes */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 11, fontWeight: 700 }}>INTERNAL PACKING NOTES</label>
                    <textarea
                      placeholder="Add shipping notes..."
                      value={modalAdminNotes}
                      onChange={e => setModalAdminNotes(e.target.value)}
                      style={{ fontSize: 12, padding: '6px 8px', border: '1px solid var(--neutral-200)', borderRadius: 6, minHeight: 48, resize: 'none' }}
                    />
                  </div>

                </div>

              </div>

              {/* Modal Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 24px', borderTop: '1px solid var(--neutral-100)', background: 'var(--cream-50)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                  Use the Packing Workstation for barcode label printing.
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    style={{ background: '#fff', border: '1px solid var(--neutral-200)', color: 'var(--text-primary)', padding: '8px 18px', borderRadius: 6, fontSize: 12, fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveModalDetails}
                    disabled={savingOrder}
                    className="btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', fontSize: 12 }}
                  >
                    <Save size={14} /> {savingOrder ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
