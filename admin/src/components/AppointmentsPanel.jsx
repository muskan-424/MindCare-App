import React, { useEffect, useState } from 'react';
import AssignAppointmentModal from './AssignAppointmentModal';
import { useTranslation } from '../i18n.jsx';

export default function AppointmentsPanel({ client, T, onRefresh }) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('awaiting_admin');
  const [rows, setRows] = useState([]);
  const [assignTarget, setAssignTarget] = useState(null);

  const load = () => {
    client.getAppointments(filter).then(setRows).catch(() => setRows([]));
  };

  useEffect(() => { load(); }, [filter, client]);

  const statusColor = (s) => {
    if (s === 'awaiting_admin') return T.orange;
    if (s === 'confirmed') return T.green;
    if (s === 'cancelled') return T.textMuted;
    return T.btn;
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ fontSize: 13, fontWeight: 600 }}>{t('web.appt_filter')}</label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg, color: T.text }}
        >
          <option value="awaiting_admin">{t('web.appt_awaiting')}</option>
          <option value="pending">{t('web.appt_pending')}</option>
          <option value="confirmed">{t('web.appt_confirmed')}</option>
        </select>
        <button type="button" onClick={load} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.surface, cursor: 'pointer', color: T.text }}>{t('web.appt_refresh')}</button>
      </div>

      {rows.length === 0 ? (
        <p style={{ color: T.textMuted, fontStyle: 'italic' }}>{t('web.appt_none')}</p>
      ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {rows.map((a) => (
          <div key={a.id} style={{ padding: 14, borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <strong>{a.userName}</strong>
                <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 700, color: statusColor(a.status) }}>{a.status}</span>
              </div>
            </div>
            <div style={{ fontSize: 13, color: T.textMuted, marginTop: 6 }}>
              {t('web.appt_pref', {
                speciality: a.requestedSpeciality || t('web.appt_general'),
                dates: (a.preferredDates || []).join(', ') || '—',
                time: a.preferredTime || t('web.appt_any_time'),
              })}
            </div>
            {a.status === 'awaiting_admin' && (
              <button
                type="button"
                onClick={() => setAssignTarget(a)}
                style={{ marginTop: 10, padding: '6px 14px', background: T.btn, color: T.btnText, border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
              >
                {t('web.appt_assign')}
              </button>
            )}
          </div>
        ))}
      </div>
      )}

      {assignTarget && (
        <AssignAppointmentModal
          appointment={assignTarget}
          client={client}
          T={T}
          onClose={() => setAssignTarget(null)}
          onDone={() => { setAssignTarget(null); load(); onRefresh?.(); }}
        />
      )}
    </div>
  );
}
