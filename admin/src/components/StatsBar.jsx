import React from 'react';
import { useTranslation } from '../i18n.jsx';

export default function StatsBar({ stats, pendingTotal, T }) {
  const { t } = useTranslation();
  if (!stats) return null;

  const cards = [
    { labelKey: 'web.stat_total_users', value: stats.totalUsers, color: T.btn },
    { labelKey: 'web.stat_assessments', value: stats.totalAssessments, color: T.btn },
    { labelKey: 'web.stat_critical_today', value: stats.criticalToday, color: T.red },
    { labelKey: 'web.stat_high_risk_week', value: stats.highRiskWeek, color: '#e67e22' },
    { labelKey: 'web.stat_avg_mood_week', value: stats.avgMoodWeek ?? '—', color: T.btn },
    { labelKey: 'web.stat_pending_review', value: pendingTotal ?? '—', color: pendingTotal > 0 ? T.red : T.textMuted },
  ];

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
      {cards.map((c) => (
        <div
          key={c.labelKey}
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
            {t(c.labelKey)}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: c.color, marginTop: 4 }}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}
