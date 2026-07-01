import React, { useEffect, useState } from 'react';
import { useTranslation } from '../i18n.jsx';

function BarChart({ items, valueKey, labelKey, color, T }) {
  const max = Math.max(...items.map((i) => i[valueKey] || 0), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map((row, idx) => {
        const v = row[valueKey] || 0;
        const pct = Math.round((v / max) * 100);
        return (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
            <span style={{ width: 72, color: T.textMuted }}>{row[labelKey]}</span>
            <div style={{ flex: 1, height: 18, background: T.bg, borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4 }} />
            </div>
            <span style={{ width: 36, textAlign: 'right', fontWeight: 600 }}>{typeof v === 'number' && v % 1 ? v.toFixed(1) : v}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function AnalyticsPanel({ client, T }) {
  const { t } = useTranslation();
  const [data, setData] = useState(null);

  useEffect(() => {
    client.getAnalytics().then(setData).catch(() => setData(null));
  }, [client]);

  if (!data) return <p style={{ color: T.textMuted }}>{t('web.analytics_loading')}</p>;

  const kpis = data.kpis || {};
  const card = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 };

  const riskItems = (data.riskTrend || []).slice(-14).map((r) => ({
    label: new Date(r._id?.date || r._id).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    count: r.count,
  }));

  const moodItems = (data.moodHeatmap || []).slice(0, 14).map((m) => ({
    label: m._id,
    avgRating: m.avgRating,
  }));

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          [t('web.analytics_total_users'), kpis.totalUsers],
          [t('web.analytics_escalated'), kpis.escalatedReports],
          [t('web.analytics_active_therapists'), kpis.activeTherapists],
          [t('web.analytics_pending_appts'), kpis.pendingAppointments],
        ].map(([label, value]) => (
          <div key={label} style={{ ...card, marginBottom: 0, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase' }}>{label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{value ?? '—'}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <div style={card}>
          <h4 style={{ margin: '0 0 12px' }}>{t('web.analytics_risk_trend')}</h4>
          {riskItems.length ? (
            <BarChart items={riskItems.map((r) => ({ label: r.label, count: r.count }))} valueKey="count" labelKey="label" color={T.red} T={T} />
          ) : (
            <p style={{ color: T.textMuted, fontSize: 13 }}>{t('admin.no_risk_data')}</p>
          )}
        </div>
        <div style={card}>
          <h4 style={{ margin: '0 0 12px' }}>{t('web.analytics_mood_heatmap')}</h4>
          {moodItems.length ? (
            <BarChart items={moodItems.map((m) => ({ label: m.label, avgRating: m.avgRating }))} valueKey="avgRating" labelKey="label" color={T.accent} T={T} />
          ) : (
            <p style={{ color: T.textMuted, fontSize: 13 }}>{t('admin.no_mood_data')}</p>
          )}
        </div>
      </div>
    </div>
  );
}
