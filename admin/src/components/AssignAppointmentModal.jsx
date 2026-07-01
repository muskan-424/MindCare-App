import React, { useEffect, useState } from 'react';
import { useTranslation } from '../i18n.jsx';

export default function AssignAppointmentModal({ appointment, client, onClose, onAssigned, onDone, T }) {
  const { t } = useTranslation();
  const [therapists, setTherapists] = useState([]);
  const [therapistId, setTherapistId] = useState('');
  const [date, setDate] = useState(appointment.preferredDates?.[0] || '');
  const [timeSlot, setTimeSlot] = useState('');
  const [available, setAvailable] = useState([]);
  const [adminNote, setAdminNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const finish = onDone || onAssigned;

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
      setErr(t('web.modal_assign_incomplete'));
      return;
    }
    setLoading(true);
    setErr('');
    try {
      await client.assignAppointment(appointment.id, { therapistId, date, timeSlot, adminNote });
      finish?.();
      onClose();
    } catch (e) {
      setErr(e.response?.data?.error || e.message || t('web.modal_assign_failed'));
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
        <h3 style={{ margin: '0 0 8px' }}>{t('web.appt_assign')}</h3>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: T.textMuted }}>
          {appointment.userName} · {appointment.requestedSpeciality || t('web.appt_general')}
        </p>

        <label style={{ fontSize: 13, fontWeight: 600 }}>{t('web.modal_select_therapist')}</label>
        <select value={therapistId} onChange={(e) => setTherapistId(e.target.value)} style={input}>
          <option value="">{t('web.modal_select', 'Select…')}</option>
          {therapists.map((th) => (
            <option key={th.id} value={th.id}>{th.name} — {th.specialisation}</option>
          ))}
        </select>

        <label style={{ fontSize: 13, fontWeight: 600 }}>{t('web.modal_select_date')}</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={input} />

        <label style={{ fontSize: 13, fontWeight: 600 }}>{t('web.modal_time_slot')}</label>
        <select value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)} style={input}>
          <option value="">{t('web.modal_select', 'Select…')}</option>
          {available.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {therapistId && date && available.length === 0 && (
          <p style={{ fontSize: 12, color: T.textMuted, marginTop: -8 }}>{t('admin.no_slots')}</p>
        )}

        <label style={{ fontSize: 13, fontWeight: 600 }}>{t('web.modal_note_optional')}</label>
        <textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} rows={2} style={{ ...input, resize: 'vertical' }} />

        {err && <p style={{ color: T.red, fontSize: 13 }}>{err}</p>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={{ padding: '8px 16px', border: `1px solid ${T.border}`, borderRadius: 6, background: 'transparent', cursor: 'pointer', color: T.text }}>{t('common.cancel')}</button>
          <button type="button" onClick={submit} disabled={loading} style={{ padding: '8px 16px', background: T.btn, color: T.btnText, border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
            {loading ? t('web.modal_assigning') : t('web.modal_confirm_assignment')}
          </button>
        </div>
      </div>
    </div>
  );
}
