import React, { useState } from 'react';

/** Simple modal with optional note field and confirm/cancel. */
export default function NoteModal({
  title, description, noteLabel, noteRequired, confirmLabel, confirmDanger, onClose, onConfirm, T,
}) {
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    if (noteRequired && !note.trim()) {
      setErr('A note is required.');
      return;
    }
    setLoading(true);
    setErr('');
    try {
      await onConfirm(note.trim());
      onClose();
    } catch (e) {
      setErr(e.response?.data?.error || e.message || 'Action failed');
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
        <h3 style={{ margin: '0 0 8px', fontSize: 17 }}>{title}</h3>
        {description && <p style={{ margin: '0 0 14px', fontSize: 13, color: T.textMuted }}>{description}</p>}
        {noteLabel && (
          <>
            <label style={{ fontSize: 13, fontWeight: 600 }}>{noteLabel}</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              style={{
                display: 'block', width: '100%', margin: '6px 0 14px', padding: 8,
                borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg, color: T.text,
                resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
          </>
        )}
        {err && <p style={{ color: T.red, fontSize: 13 }}>{err}</p>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={btnGhost(T)}>Cancel</button>
          <button
            type="button"
            onClick={submit}
            disabled={loading}
            style={confirmDanger ? btnDanger(T) : btnPrimary(T)}
          >
            {loading ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function btnPrimary(T) {
  return { padding: '8px 16px', background: T.btn, color: T.btnText, border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 };
}
function btnDanger(T) {
  return { padding: '8px 16px', background: T.red, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 };
}
function btnGhost(T) {
  return { padding: '8px 16px', background: 'transparent', color: T.text, border: `1px solid ${T.border}`, borderRadius: 6, cursor: 'pointer' };
}
