import React from 'react';

export default function StatsBar({ stats, pendingTotal, T }) {
  if (!stats) return null;

  const cards = [
    { label: 'Total users', value: stats.totalUsers, color: T.btn },
    { label: 'Assessments', value: stats.totalAssessments, color: T.btn },
    { label: 'Critical today', value: stats.criticalToday, color: T.red },
    { label: 'High risk (7d)', value: stats.highRiskWeek, color: '#e67e22' },
    { label: 'Avg mood (7d)', value: stats.avgMoodWeek ?? '—', color: T.btn },
    { label: 'Pending review', value: pendingTotal ?? '—', color: pendingTotal > 0 ? T.red : T.textMuted },
  ];

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
      {cards.map((c) => (
        <div
          key={c.label}
          style={{
            flex: '1 1 140px',
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 8,
            padding: '12px 14px',
            minWidth: 120,
          }}
        >
          <div style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {c.label}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: c.color, marginTop: 4 }}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}
