import React, { useEffect, useState } from 'react';

function BarChart({ items, valueKey, labelKey, maxVal, color, T }) {
  const max = maxVal || Math.max(...items.map((i) => i[valueKey] || 0), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map((item, idx) => {
        const v = item[valueKey] || 0;
        const pct = Math.round((v / max) * 100);
        return (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
            <span style={{ width: 72, color: T.textMuted, flexShrink: 0 }}>{item[labelKey]}</span>
            <div style={{ flex: 1, height: 18, background: T.bg, borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, minWidth: v ? 4 : 0 }} />
            </div>
            <span style={{ width: 36, textAlign: 'right', fontWeight: 600 }}>{typeof v === 'number' && v % 1 ? v.toFixed(1) : v}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function AnalyticsPanel({ client, T }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    setLoading(true);
    client.getAnalytics()
      .then(setData)
      .catch((e) => setErr(e.response?.data?.error || e.message))
      .finally(() => setLoading(false));
  }, [client]);

  if (loading) return <p style={{ color: T.textMuted }}>Loading analytics…</p>;
  if (err) return <p style={{ color: T.red }}>{err}</p>;
  if (!data) return null;

  const { riskTrend = [], moodHeatmap = [], kpis = {} } = data;
  const card = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 };

  const riskItems = riskTrend.slice(-14).map((r) => ({
    label: String(r.date).slice(5),
    count: r.count,
    avgSeverity: r.avgSeverity,
  }));
  const moodItems = moodHeatmap.slice(-14).map((m) => ({
    label: String(m.date).slice(5),
    avgRating: m.avgRating,
    count: m.count,
  }));

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          ['Total users', kpis.totalUsers],
          ['Escalated reports', kpis.escalatedReports],
          ['Active therapists', kpis.activeTherapists],
          ['Pending appts', kpis.pendingAppointments],
        ].map(([label, val]) => (
          <div key={label} style={{ ...card, marginBottom: 0, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: T.accent }}>{val ?? '—'}</div>
            <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <div style={card}>
          <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>Risk reports (14 days)</h4>
          {riskItems.length === 0 ? (
            <p style={{ color: T.textMuted, fontSize: 13 }}>No data yet.</p>
          ) : (
            <BarChart items={riskItems.map((r) => ({ label: r.label, count: r.count }))} valueKey="count" labelKey="label" color={T.red} T={T} />
          )}
        </div>
        <div style={card}>
          <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>Avg mood rating (14 days)</h4>
          {moodItems.length === 0 ? (
            <p style={{ color: T.textMuted, fontSize: 13 }}>No mood entries yet.</p>
          ) : (
            <BarChart items={moodItems.map((m) => ({ label: m.label, avgRating: m.avgRating }))} valueKey="avgRating" labelKey="label" color={T.accent} T={T} />
          )}
        </div>
      </div>
    </div>
  );
}
