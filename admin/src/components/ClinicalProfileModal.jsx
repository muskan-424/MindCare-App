import React from 'react';
import { RISK_COLORS } from '../api';

export default function ClinicalProfileModal({ profile, onClose, T }) {
  if (!profile) return null;

  const overlay = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  };
  const sheet = {
    background: T.surface, borderRadius: 10, padding: 24, width: 'min(640px, 94vw)',
    maxHeight: '85vh', overflowY: 'auto', border: `1px solid ${T.border}`, color: T.text,
  };
  const section = { marginTop: 20 };
  const card = {
    padding: 10, marginTop: 8, borderRadius: 6,
    border: `1px solid ${T.border}`, background: T.bg, fontSize: 13,
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={sheet} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18 }}>{profile.user?.name}</h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: T.textMuted }}>{profile.user?.email}</p>
          </div>
          <button type="button" onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 20, color: T.textMuted }}>×</button>
        </div>

        <div style={section}>
          <strong>AI intake ({profile.fusions?.length || 0})</strong>
          {(profile.fusions || []).length === 0 && <p style={{ color: T.textMuted, fontSize: 13 }}>None</p>}
          {(profile.fusions || []).map((f) => (
            <div key={f.id} style={{ ...card, borderLeft: `3px solid ${RISK_COLORS[f.riskLevel] || T.border}` }}>
              <strong style={{ color: RISK_COLORS[f.riskLevel] }}>{f.riskLevel}</strong>
              {' · Score '}{(f.riskScore * 100).toFixed(0)}%
              {' · '}{new Date(f.createdAt).toLocaleString()}
            </div>
          ))}
        </div>

        <div style={section}>
          <strong>Risk reports ({profile.issues?.length || 0})</strong>
          {(profile.issues || []).map((i) => (
            <div key={i.id} style={card}>
              {i.category} · severity {i.severity}/5 · {i.riskLevel}
              {' · '}{new Date(i.createdAt).toLocaleDateString()}
            </div>
          ))}
        </div>

        <div style={section}>
          <strong>Recent moods ({profile.moods?.length || 0})</strong>
          {(profile.moods || []).slice(0, 8).map((m) => (
            <div key={m.id} style={card}>
              Rating {m.rating} · {new Date(m.date).toLocaleDateString()}
              {m.note ? ` · ${m.note}` : ''}
            </div>
          ))}
        </div>

        <div style={section}>
          <strong>Journals ({profile.journals?.length || 0})</strong>
          {(profile.journals || []).slice(0, 5).map((j) => (
            <div key={j.id} style={card}>
              {j.title || 'Untitled'} · {j.contentPreview}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
