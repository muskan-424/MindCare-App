import React, { useState } from 'react';
import { RISK_COLORS } from '../api';
import VerifyModal from './VerifyModal';
import NoteModal from './NoteModal';
import AssignAppointmentModal from './AssignAppointmentModal';

function QueueSection({ title, items, renderItem, empty, T }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10, color: T.text }}>{title}</h3>
      {items.length === 0 ? (
        <p style={{ fontSize: 13, color: T.textMuted, fontStyle: 'italic' }}>{empty}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{items.map(renderItem)}</div>
      )}
    </div>
  );
}

export default function PendingPanel({ pending, client, onRefresh, onSelectUser, T }) {
  const [verifyTarget, setVerifyTarget] = useState(null);
  const [ecAction, setEcAction] = useState(null);
  const [deletionAction, setDeletionAction] = useState(null);
  const [assignTarget, setAssignTarget] = useState(null);

  if (!pending) {
    return <p style={{ color: T.textMuted }}>Load admin token to see pending items.</p>;
  }

  const card = (extra = {}) => ({
    padding: '12px 14px', borderRadius: 8, border: `1px solid ${T.border}`,
    background: T.surface, fontSize: 13, ...extra,
  });

  const handleVerify = async (body) => {
    await client.verifyIssue(verifyTarget.id, body);
    onRefresh();
  };

  return (
    <>
      {pending.escalatedCount > 0 && (
        <div style={{
          padding: '10px 14px', marginBottom: 16, borderRadius: 8,
          background: '#fdecea', border: '1px solid #f5c6cb', color: '#c0392b', fontSize: 13,
        }}>
          {pending.escalatedCount} escalated report(s) need immediate attention.
        </div>
      )}

      <QueueSection
        title={`Risk reports (${pending.riskReports?.length || 0})`}
        items={pending.riskReports || []}
        empty="No unverified high/critical reports."
        T={T}
        renderItem={(r) => (
          <div key={r.id} style={{ ...card(), borderLeft: `4px solid ${RISK_COLORS[r.riskLevel]}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <strong>{r.userName || 'User'}</strong>
                <span style={{ color: T.textMuted }}> · {r.riskLevel}</span>
                {r.escalated && <span style={{ color: T.red, fontWeight: 700 }}> · ESCALATED</span>}
                <div style={{ color: T.textMuted, marginTop: 4 }}>{new Date(r.createdAt).toLocaleString()}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {r.userId && (
                  <button type="button" style={btnSmall(T)} onClick={() => onSelectUser({ id: r.userId, name: r.userName, email: r.userEmail })}>
                    View user
                  </button>
                )}
                <button type="button" style={btnPrimarySmall(T)} onClick={() => setVerifyTarget(r)}>
                  Verify
                </button>
              </div>
            </div>
          </div>
        )}
      />

      <QueueSection
        title={`Appointment requests (${pending.appointmentRequests?.length || 0})`}
        items={pending.appointmentRequests || []}
        empty="No appointments awaiting admin."
        T={T}
        renderItem={(a) => (
          <div key={a.id} style={card()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <strong>{a.userName}</strong> requested {a.requestedSpeciality || 'therapy'}
                <div style={{ color: T.textMuted, marginTop: 4 }}>{new Date(a.createdAt).toLocaleString()}</div>
              </div>
              <button type="button" style={btnPrimarySmall(T)} onClick={() => setAssignTarget(a)}>Assign</button>
            </div>
          </div>
        )}
      />

      <QueueSection
        title={`Emergency contacts (${pending.pendingContacts?.length || 0})`}
        items={pending.pendingContacts || []}
        empty="No emergency contacts pending."
        T={T}
        renderItem={(c) => (
          <div key={c.id} style={card()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <strong>{c.userName}</strong> — {c.contactName} ({c.relationship})
                <div style={{ color: T.textMuted, marginTop: 4 }}>{c.phone}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" style={btnPrimarySmall(T)} onClick={() => setEcAction({ type: 'verify', contact: c })}>Verify</button>
                <button type="button" style={btnDangerSmall(T)} onClick={() => setEcAction({ type: 'reject', contact: c })}>Reject</button>
              </div>
            </div>
          </div>
        )}
      />

      <QueueSection
        title={`Deletion requests (${pending.deletionRequests?.length || 0})`}
        items={pending.deletionRequests || []}
        empty="No pending deletion requests."
        T={T}
        renderItem={(d) => (
          <div key={d.id} style={card()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <strong>{d.userName}</strong> requested account deletion
                <div style={{ color: T.textMuted, marginTop: 4 }}>{new Date(d.createdAt).toLocaleString()}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" style={btnDangerSmall(T)} onClick={() => setDeletionAction({ type: 'approve', request: d })}>Approve wipe</button>
                <button type="button" style={btnSmall(T)} onClick={() => setDeletionAction({ type: 'reject', request: d })}>Reject</button>
              </div>
            </div>
          </div>
        )}
      />

      {verifyTarget && (
        <VerifyModal report={verifyTarget} T={T} onClose={() => setVerifyTarget(null)} onConfirm={handleVerify} />
      )}

      {ecAction?.type === 'verify' && (
        <NoteModal
          title="Verify emergency contact"
          description={`Confirm ${ecAction.contact.contactName} for ${ecAction.contact.userName}.`}
          noteLabel="Admin note (optional)"
          confirmLabel="Verify contact"
          T={T}
          onClose={() => setEcAction(null)}
          onConfirm={(note) => client.verifyEmergencyContact(ecAction.contact.id, { adminNote: note }).then(onRefresh)}
        />
      )}

      {ecAction?.type === 'reject' && (
        <NoteModal
          title="Reject emergency contact"
          description="User will be notified to update their contact."
          noteLabel="Reason for rejection"
          noteRequired
          confirmLabel="Reject"
          confirmDanger
          T={T}
          onClose={() => setEcAction(null)}
          onConfirm={(note) => client.rejectEmergencyContact(ecAction.contact.id, { rejectionReason: note }).then(onRefresh)}
        />
      )}

      {deletionAction?.type === 'approve' && (
        <NoteModal
          title="Approve account deletion"
          description={`This permanently deletes ${deletionAction.request.userName}'s account and all associated data. This cannot be undone.`}
          noteLabel="Audit note (optional)"
          confirmLabel="Delete all data"
          confirmDanger
          T={T}
          onClose={() => setDeletionAction(null)}
          onConfirm={(note) => client.reviewDeletionRequest(deletionAction.request.id, { action: 'approve', adminNote: note }).then(onRefresh)}
        />
      )}

      {deletionAction?.type === 'reject' && (
        <NoteModal
          title="Reject deletion request"
          noteLabel="Reason (optional)"
          confirmLabel="Reject request"
          T={T}
          onClose={() => setDeletionAction(null)}
          onConfirm={(note) => client.reviewDeletionRequest(deletionAction.request.id, { action: 'reject', adminNote: note }).then(onRefresh)}
        />
      )}

      {assignTarget && (
        <AssignAppointmentModal
          appointment={assignTarget}
          client={client}
          T={T}
          onClose={() => setAssignTarget(null)}
          onAssigned={onRefresh}
        />
      )}
    </>
  );
}

function btnSmall(T) {
  return {
    padding: '6px 12px', fontSize: 12, borderRadius: 6, cursor: 'pointer',
    border: `1px solid ${T.border}`, background: T.bg, color: T.text,
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
