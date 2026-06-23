import React, { useEffect, useState } from 'react';
import AssignAppointmentModal from './AssignAppointmentModal';

export default function AppointmentsPanel({ client, onRefresh, T }) {
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState('awaiting_admin');
  const [loading, setLoading] = useState(true);
  const [assignTarget, setAssignTarget] = useState(null);
  const [err, setErr] = useState('');

  const load = () => {
    setLoading(true);
    client.getAppointments(filter || undefined)
      .then(setAppointments)
      .catch((e) => setErr(e.response?.data?.error || e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [client, filter]);

  const statusColor = (s) => {
    if (s === 'awaiting_admin') return T.orange;
    if (s === 'confirmed') return T.green;
    if (s === 'cancelled') return T.textMuted;
    return T.accent;
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ fontSize: 13, fontWeight: 600 }}>Status</label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.surface, color: T.text }}
        >
          <option value="awaiting_admin">Awaiting admin</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="">All</option>
        </select>
        <button type="button" onClick={load} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.surface, cursor: 'pointer', color: T.text }}>Refresh</button>
      </div>

      {loading && <p style={{ color: T.textMuted }}>Loading…</p>}
      {err && <p style={{ color: T.red }}>{err}</p>}

      {!loading && appointments.length === 0 && (
        <p style={{ color: T.textMuted }}>No appointments in this queue.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {appointments.map((a) => (
          <div key={a.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <strong>{a.userName}</strong>
                <span style={{ color: T.textMuted, fontSize: 13 }}> · {a.userEmail}</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: statusColor(a.status) }}>{a.status}</span>
            </div>
            <p style={{ margin: '8px 0', fontSize: 13, color: T.textMuted }}>
              {a.requestedSpeciality || 'General'} · Pref: {(a.preferredDates || []).join(', ') || '—'} · {a.preferredTime || 'any time'}
            </p>
            {a.userNote && <p style={{ margin: '0 0 8px', fontSize: 13 }}>Note: {a.userNote}</p>}
            {a.therapistName && (
              <p style={{ margin: '0 0 8px', fontSize: 13 }}>
                Assigned: {a.therapistName} · {a.date} {a.timeSlot}
              </p>
            )}
            {a.status === 'awaiting_admin' && (
              <button
                type="button"
                onClick={() => setAssignTarget(a)}
                style={{ padding: '6px 14px', background: T.btn, color: T.btnText, border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
              >
                Assign therapist
              </button>
            )}
          </div>
        ))}
      </div>

      {assignTarget && (
        <AssignAppointmentModal
          appointment={assignTarget}
          client={client}
          T={T}
          onClose={() => setAssignTarget(null)}
          onAssigned={() => { load(); onRefresh?.(); }}
        />
      )}
    </div>
  );
}
