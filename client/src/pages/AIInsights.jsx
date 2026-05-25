import AdminLayout from '../layouts/AdminLayout';

export default function AIInsights() {
  return (
    <AdminLayout>
      <div style={{ padding: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>AI Insights</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>Gemini-powered insights for your boutique</p>
        <div style={{ background: 'linear-gradient(135deg, var(--rose-50), var(--mauve-100))', borderRadius: 'var(--radius-xl)', padding: 40, textAlign: 'center', border: '1px solid var(--rose-200)' }}>
          <div style={{ fontSize: 60, marginBottom: 16 }}>🤖</div>
          <h2 style={{ fontSize: 22, marginBottom: 8, color: 'var(--rose-800)' }}>AI Features Active</h2>
          <p style={{ color: 'var(--mauve-600)', fontSize: 14, maxWidth: 400, margin: '0 auto' }}>
            Gemini AI is integrated and ready. AI-powered product descriptions, pricing suggestions, and trend analysis are available through the product management panel.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
