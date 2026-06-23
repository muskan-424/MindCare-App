import React, { useState } from 'react';
import { ADMIN_ACTIONS } from '../api';

export default function VerifyModal({ report, onClose, onConfirm, T }) {
  const [note, setNote] = useState('');
  const [action, setAction] = useState('contacted');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    setLoading(true);
    setErr('');
    try {
      await onConfirm({ adminNote: note, adminAction: action, assignedResources: [] });
      onClose();
    } catch (e) {
      setErr(e.response?.data?.error || e.message || 'Verify failed');
    } finally {
      setLoading(false);
    }
  };

  const overlay = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  };
  const sheet = {
    background: T.surface, borderRadius: 10, padding: 24, width: 'min(420px, 92vw)',
    border: `1px solid ${T.border}`, color: T.text,
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={sheet} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 8px', fontSize: 17 }}>Verify risk report</h3>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: T.textMuted }}>
          {report.category} · {report.riskLevel} · {new Date(report.createdAt).toLocaleString()}
        </p>
        <label style={{ fontSize: 13, fontWeight: 600 }}>Action</label>
        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          style={{
            display: 'block', width: '100%', margin: '6px 0 14px', padding: 8,
            borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg, color: T.text,
          }}
        >
          {ADMIN_ACTIONS.map((a) => (
            <option key={a.value} value={a.value}>{a.label}</option>
          ))}
        </select>
        <label style={{ fontSize: 13, fontWeight: 600 }}>Admin note</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Optional clinical note…"
          style={{
            display: 'block', width: '100%', margin: '6px 0 14px', padding: 8,
            borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg, color: T.text,
            resize: 'vertical', fontFamily: 'inherit',
          }}
        />
        {err && <p style={{ color: T.red, fontSize: 13 }}>{err}</p>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={btnSecondary(T)}>Cancel</button>
          <button type="button" onClick={submit} disabled={loading} style={btnPrimary(T)}>
            {loading ? 'Saving…' : 'Mark verified'}
          </button>
        </div>
      </div>
    </div>
  );
}

function btnPrimary(T) {
  return {
    padding: '8px 16px', background: T.btn, color: T.btnText, border: 'none',
    borderRadius: 6, cursor: 'pointer', fontWeight: 600,
  };
}

function btnSecondary(T) {
  return {
    padding: '8px 16px', background: 'transparent', color: T.text,
    border: `1px solid ${T.border}`, borderRadius: 6, cursor: 'pointer',
  };
}
