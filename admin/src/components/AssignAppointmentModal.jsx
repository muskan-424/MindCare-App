import React, { useEffect, useState } from 'react';

export default function AssignAppointmentModal({ appointment, client, onClose, onAssigned, T }) {
  const [therapists, setTherapists] = useState([]);
  const [therapistId, setTherapistId] = useState('');
  const [date, setDate] = useState(appointment.preferredDates?.[0] || '');
  const [timeSlot, setTimeSlot] = useState('');
  const [available, setAvailable] = useState([]);
  const [adminNote, setAdminNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    client.getTherapists().then(setTherapists).catch(() => setTherapists([]));
  }, [client]);

  useEffect(() => {
    if (!therapistId || !date) {
      setAvailable([]);
      return;
    }
    client.getTherapistAvailability(therapistId, date, appointment.id)
      .then((data) => setAvailable(data.available || []))
      .catch(() => setAvailable([]));
  }, [client, therapistId, date, appointment.id]);

  const submit = async () => {
    if (!therapistId || !date || !timeSlot) {
      setErr('Select therapist, date, and time slot.');
      return;
    }
    setLoading(true);
    setErr('');
    try {
      await client.assignAppointment(appointment.id, { therapistId, date, timeSlot, adminNote });
      onAssigned();
      onClose();
    } catch (e) {
      setErr(e.response?.data?.error || e.message || 'Assign failed');
    } finally {
      setLoading(false);
    }
  };

  const overlay = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  };
  const sheet = {
    background: T.surface, borderRadius: 10, padding: 24, width: 'min(480px, 94vw)',
    maxHeight: '90vh', overflowY: 'auto', border: `1px solid ${T.border}`, color: T.text,
  };
  const input = {
    display: 'block', width: '100%', margin: '6px 0 14px', padding: 8, boxSizing: 'border-box',
    borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg, color: T.text,
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={sheet} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 8px' }}>Assign therapist</h3>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: T.textMuted }}>
          {appointment.userName} · {appointment.requestedSpeciality || 'therapy'}
        </p>

        <label style={{ fontSize: 13, fontWeight: 600 }}>Therapist</label>
        <select value={therapistId} onChange={(e) => setTherapistId(e.target.value)} style={input}>
          <option value="">Select…</option>
          {therapists.map((t) => (
            <option key={t.id} value={t.id}>{t.name} — {t.specialisation}</option>
          ))}
        </select>

        <label style={{ fontSize: 13, fontWeight: 600 }}>Date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={input} />

        <label style={{ fontSize: 13, fontWeight: 600 }}>Time slot</label>
        <select value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)} style={input}>
          <option value="">Select…</option>
          {available.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {therapistId && date && available.length === 0 && (
          <p style={{ fontSize: 12, color: T.textMuted, marginTop: -8 }}>No slots available for this date.</p>
        )}

        <label style={{ fontSize: 13, fontWeight: 600 }}>Admin note (optional)</label>
        <textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} rows={2} style={{ ...input, resize: 'vertical' }} />

        {err && <p style={{ color: T.red, fontSize: 13 }}>{err}</p>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={{ padding: '8px 16px', border: `1px solid ${T.border}`, borderRadius: 6, background: 'transparent', cursor: 'pointer', color: T.text }}>Cancel</button>
          <button type="button" onClick={submit} disabled={loading} style={{ padding: '8px 16px', background: T.btn, color: T.btnText, border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
            {loading ? 'Assigning…' : 'Confirm assignment'}
          </button>
        </div>
      </div>
    </div>
  );
}
