import React, { useState } from 'react';
import NoteModal from './NoteModal';
import AssignAppointmentModal from './AssignAppointmentModal';
import VerifyModal from './VerifyModal';
import { useTranslation } from '../i18n.jsx';

function Section({ title, empty, items, renderItem, T }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>{title}</h3>
      {items.length === 0 ? (
        <p style={{ fontSize: 13, color: T.textMuted, fontStyle: 'italic' }}>{empty}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{items.map(renderItem)}</div>
      )}
    </div>
  );
}

export default function PendingPanel({ pending, client, T, onRefresh, onSelectUser }) {
  const { t } = useTranslation();
  const [verifyTarget, setVerifyTarget] = useState(null);
  const [assignTarget, setAssignTarget] = useState(null);
  const [ecAction, setEcAction] = useState(null);
  const [deletionAction, setDeletionAction] = useState(null);

  if (!pending) return <p style={{ color: T.textMuted }}>{t('web.loading')}</p>;

  return (
    <div>
      <Section
        title={t('web.pending_risk_title')}
        empty={t('web.pending_risk_empty')}
        items={pending.riskReports || []}
        T={T}
        renderItem={(r) => (
          <div key={r.id} style={{ padding: 12, borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <strong>{r.userName || t('web.pending_user_fallback')}</strong>
                <div style={{ fontSize: 12, color: T.textMuted }}>{r.category} · {r.riskLevel}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {r.userId && (
                  <button type="button" style={btnSmall(T)} onClick={() => onSelectUser({ id: r.userId, name: r.userName, email: r.userEmail })}>
                    {t('web.pending_view_user')}
                  </button>
                )}
                <button type="button" style={btnPrimarySmall(T)} onClick={() => setVerifyTarget(r)}>
                  {t('web.verify_btn')}
                </button>
              </div>
            </div>
          </div>
        )}
      />

      <Section
        title={t('web.pending_appt_title')}
        empty={t('web.pending_appt_empty')}
        items={pending.appointmentRequests || []}
        T={T}
        renderItem={(a) => (
          <div key={a.id} style={{ padding: 12, borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <strong>{a.userName}</strong> {t('web.appt_requested', { speciality: a.requestedSpeciality || t('web.appt_general') })}
                <div style={{ fontSize: 12, color: T.textMuted }}>{a.userEmail}</div>
              </div>
              <button type="button" style={btnPrimarySmall(T)} onClick={() => setAssignTarget(a)}>{t('web.pending_assign')}</button>
            </div>
          </div>
        )}
      />

      <Section
        title={t('web.pending_ec_title')}
        empty={t('web.pending_ec_empty')}
        items={pending.pendingContacts || []}
        T={T}
        renderItem={(c) => (
          <div key={c.id} style={{ padding: 12, borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <strong>{c.userName}</strong> · {c.contactName} ({c.relationship})
                <div style={{ fontSize: 12, color: T.textMuted }}>{c.phone}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" style={btnPrimarySmall(T)} onClick={() => setEcAction({ type: 'verify', contact: c })}>{t('web.pending_verify')}</button>
                <button type="button" style={btnDangerSmall(T)} onClick={() => setEcAction({ type: 'reject', contact: c })}>{t('web.pending_reject')}</button>
              </div>
            </div>
          </div>
        )}
      />

      <Section
        title={t('web.pending_del_title')}
        empty={t('web.pending_del_empty')}
        items={pending.deletionRequests || []}
        T={T}
        renderItem={(d) => (
          <div key={d.id} style={{ padding: 12, borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <strong>{d.userName}</strong>
                <div style={{ fontSize: 12, color: T.textMuted }}>{d.userEmail}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" style={btnDangerSmall(T)} onClick={() => setDeletionAction({ type: 'approve', request: d })}>{t('web.pending_approve_wipe')}</button>
                <button type="button" style={btnSmall(T)} onClick={() => setDeletionAction({ type: 'reject', request: d })}>{t('web.pending_reject')}</button>
              </div>
            </div>
          </div>
        )}
      />

      {verifyTarget && (
        <VerifyModal report={verifyTarget} T={T} onClose={() => setVerifyTarget(null)} onConfirm={async (body) => {
          await client.verifyIssue(verifyTarget.id, body);
          setVerifyTarget(null);
          onRefresh();
        }} />
      )}

      {assignTarget && (
        <AssignAppointmentModal appointment={assignTarget} client={client} T={T} onClose={() => setAssignTarget(null)} onDone={() => { setAssignTarget(null); onRefresh(); }} />
      )}

      {ecAction?.type === 'verify' && (
        <NoteModal
          title={t('web.modal_verify_ec')}
          description={`${ecAction.contact.userName} · ${ecAction.contact.contactName}`}
          noteLabel={t('web.modal_note_optional')}
          confirmLabel={t('web.modal_confirm_verify_ec')}
          T={T}
          onClose={() => setEcAction(null)}
          onConfirm={(note) => client.verifyEmergencyContact(ecAction.contact.id, { adminNote: note }).then(onRefresh)}
        />
      )}

      {ecAction?.type === 'reject' && (
        <NoteModal
          title={t('web.modal_reject_ec')}
          description={t('web.modal_reject_ec_desc')}
          noteLabel={t('web.modal_reason_rejection')}
          confirmLabel={t('web.modal_confirm_reject')}
          danger
          T={T}
          onClose={() => setEcAction(null)}
          onConfirm={(note) => client.rejectEmergencyContact(ecAction.contact.id, { rejectionReason: note }).then(onRefresh)}
        />
      )}

      {deletionAction?.type === 'approve' && (
        <NoteModal
          title={t('web.modal_approve_deletion')}
          description={deletionAction.request.userName}
          noteLabel={t('web.modal_audit_note')}
          confirmLabel={t('web.modal_confirm_delete')}
          danger
          T={T}
          onClose={() => setDeletionAction(null)}
          onConfirm={(note) => client.reviewDeletionRequest(deletionAction.request.id, { action: 'approve', adminNote: note }).then(onRefresh)}
        />
      )}

      {deletionAction?.type === 'reject' && (
        <NoteModal
          title={t('web.modal_reject_deletion')}
          noteLabel={t('web.modal_reason_optional')}
          confirmLabel={t('web.modal_confirm_reject_req')}
          T={T}
          onClose={() => setDeletionAction(null)}
          onConfirm={(note) => client.reviewDeletionRequest(deletionAction.request.id, { action: 'reject', adminNote: note }).then(onRefresh)}
        />
      )}
    </div>
  );
}

function btnSmall(T) {
  return {
    padding: '6px 12px', fontSize: 12, borderRadius: 6, cursor: 'pointer',
    border: `1px solid ${T.border}`, background: T.surface, color: T.text,
  };
}

function btnPrimarySmall(T) {
  return {
    padding: '6px 12px', fontSize: 12, borderRadius: 6, cursor: 'pointer',
    border: 'none', background: T.btn, color: T.btnText, fontWeight: 600,
  };
}

function btnDangerSmall(T) {
  return {
    padding: '6px 12px', fontSize: 12, borderRadius: 6, cursor: 'pointer',
    border: 'none', background: T.red, color: '#fff', fontWeight: 600,
  };
}
