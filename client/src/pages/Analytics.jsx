import AdminLayout from '../layouts/AdminLayout';

export default function Analytics() {
  return (
    <AdminLayout>
      <div style={{ padding: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Analytics</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>Sales and performance insights for DEEPYA COLLECTIONS</p>
        <div style={{ background: '#fff', borderRadius: 'var(--radius-xl)', padding: 40, textAlign: 'center', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--neutral-100)' }}>
          <div style={{ fontSize: 60, marginBottom: 16 }}>📊</div>
          <h2 style={{ fontSize: 22, marginBottom: 8 }}>Analytics Coming Soon</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Detailed charts and reports will appear here as your store grows.</p>
        </div>
      </div>
    </AdminLayout>
  );
}
