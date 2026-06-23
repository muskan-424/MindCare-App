/* global localStorage */
import React, { useCallback, useEffect, useState } from 'react';
import { createAdminClient, RISK_COLORS } from './api';
import StatsBar from './components/StatsBar';
import PendingPanel from './components/PendingPanel';
import AnalyticsPanel from './components/AnalyticsPanel';
import AppointmentsPanel from './components/AppointmentsPanel';
import BroadcastPanel from './components/BroadcastPanel';
import VerifyModal from './components/VerifyModal';
import ClinicalProfileModal from './components/ClinicalProfileModal';

const THEMES = {
  light: {
    bg: '#f5f7fa', surface: '#ffffff', sidebar: '#ffffff', header: '#3a7ca5',
    headerText: '#ffffff', border: '#e0e0e0', text: '#1a1a2e', textMuted: '#666',
    accent: '#e8f4f8', accentHover: '#d0eaf5', selectedBg: '#d0eaf5', tableHead: '#f0f8ff',
    red: '#c0392b', green: '#27ae60', orange: '#e67e22',
    btn: '#3a7ca5', btnText: '#fff', toggleBg: '#e0e0e0', toggleKnob: '#fff',
  },
  dark: {
    bg: '#0f0f1a', surface: '#1a1a2e', sidebar: '#16213e', header: '#1a1a2e',
    headerText: '#e0e0ff', border: '#2a2a4a', text: '#e0e0ff', textMuted: '#8888aa',
    accent: '#1e2a45', accentHover: '#243255', selectedBg: '#243255', tableHead: '#1e2a45',
    red: '#ff6b6b', green: '#2ecc71', orange: '#f39c12',
    btn: '#3a7ca5', btnText: '#fff', toggleBg: '#3a7ca5', toggleKnob: '#fff',
  },
};

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'pending', label: 'Pending review' },
  { id: 'appointments', label: 'Appointments' },
  { id: 'users', label: 'Users' },
];

export default function App() {
  const [isDark, setIsDark] = useState(() => localStorage?.getItem('ADMIN_THEME') === 'dark');
  const [token, setToken] = useState(localStorage?.getItem('ADMIN_TOKEN') || '');
  const [client, setClient] = useState(null);
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState(null);
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [issues, setIssues] = useState([]);
  const [fusions, setFusions] = useState([]);
  const [moods, setMoods] = useState([]);
  const [error, setError] = useState('');
  const [verifyTarget, setVerifyTarget] = useState(null);
  const [clinicalProfile, setClinicalProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const T = isDark ? THEMES.dark : THEMES.light;

  const refreshDashboard = useCallback(async (c) => {
    const [s, p, u] = await Promise.all([c.getStats(), c.getPending(), c.getUsers()]);
    setStats(s);
    setPending(p);
    setUsers(u);
  }, []);

  const initClient = useCallback(async (t) => {
    const trimmed = t.trim();
    if (!trimmed) return;
    const c = createAdminClient(trimmed);
    setClient(c);
    try {
      setError('');
      await refreshDashboard(c);
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Failed to load dashboard');
    }
  }, [refreshDashboard]);

  useEffect(() => {
    if (token) initClient(token);
  }, [token, initClient]);

  const handleSaveToken = () => {
    localStorage?.setItem('ADMIN_TOKEN', token.trim());
    initClient(token);
  };

  const handleSelectUser = async (u) => {
    setSelected(u);
    setTab('users');
    if (!client) return;
    try {
      setError('');
      const [iss, fusionList, mood] = await Promise.all([
        client.getIssuesForUser(u.id),
        client.getFusionsForUser(u.id),
        client.getMoodForUser(u.id),
      ]);
      setIssues(iss);
      setFusions(fusionList);
      setMoods(mood);
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Failed to load user data');
    }
  };

  const reloadUserIssues = async () => {
    if (!client || !selected) return;
    const iss = await client.getIssuesForUser(selected.id);
    setIssues(iss);
    await refreshDashboard(client);
  };

  const openClinicalProfile = async () => {
    if (!client || !selected) return;
    setProfileLoading(true);
    try {
      const profile = await client.getFullProfile(selected.id);
      setClinicalProfile(profile);
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Failed to load profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const S = {
    root: { height: '100vh', display: 'flex', flexDirection: 'column', background: T.bg, color: T.text, fontFamily: "'Segoe UI', system-ui, sans-serif" },
    header: { background: T.header, color: T.headerText, padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' },
    headerTitle: { margin: 0, fontSize: 22, fontWeight: 700 },
    headerSub: { margin: '2px 0 0', fontSize: 13, opacity: 0.8 },
    tokenBar: { padding: '10px 24px', background: T.surface, borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
    tokenInput: { padding: '6px 10px', minWidth: 280, borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg, color: T.text, fontSize: 13 },
    saveBtn: { padding: '7px 16px', background: T.btn, color: T.btnText, border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13 },
    tabBar: { display: 'flex', gap: 4, padding: '0 24px', background: T.surface, borderBottom: `1px solid ${T.border}` },
    tab: (active) => ({
      padding: '12px 18px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: active ? 700 : 500,
      color: active ? T.btn : T.textMuted, borderBottom: active ? `2px solid ${T.btn}` : '2px solid transparent',
    }),
    body: { flex: 1, display: 'flex', overflow: 'hidden' },
    sidebar: { width: '28%', minWidth: 200, borderRight: `1px solid ${T.border}`, overflowY: 'auto', background: T.sidebar },
    sidebarTitle: { padding: '14px 18px 10px', margin: 0, fontSize: 14, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 1, borderBottom: `1px solid ${T.border}` },
    userCard: (sel) => ({ padding: '10px 18px', cursor: 'pointer', background: sel ? T.selectedBg : 'transparent', borderBottom: `1px solid ${T.border}` }),
    detail: { flex: 1, padding: 24, overflowY: 'auto' },
    mainPanel: { flex: 1, padding: 24, overflowY: 'auto' },
    h2: { fontSize: 20, fontWeight: 700, marginBottom: 4 },
    h3: { fontSize: 15, fontWeight: 600, marginTop: 24, marginBottom: 10 },
    muted: { fontSize: 13, color: T.textMuted },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
    th: { textAlign: 'left', padding: '8px 10px', background: T.tableHead, color: T.textMuted, fontWeight: 600, borderBottom: `1px solid ${T.border}` },
    td: { padding: '8px 10px', borderBottom: `1px solid ${T.border}` },
    empty: { fontSize: 14, color: T.textMuted, fontStyle: 'italic' },
    errorMsg: { color: T.red, fontSize: 13 },
    actionRow: { display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' },
    outlineBtn: { padding: '8px 14px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.surface, color: T.text, cursor: 'pointer', fontSize: 13 },
    verifyBtn: { padding: '4px 10px', fontSize: 12, borderRadius: 4, border: 'none', background: T.btn, color: T.btnText, cursor: 'pointer' },
    badge: (verified) => ({ fontSize: 11, fontWeight: 700, color: verified ? '#27ae60' : '#e67e22' }),
  };

  const pendingBadge = pending?.totalPending > 0 ? ` (${pending.totalPending})` : '';

  return (
    <div style={S.root}>
      <header style={S.header}>
        <div>
          <h1 style={S.headerTitle}>MindCare Admin</h1>
          <p style={S.headerSub}>Platform oversight &amp; clinical review</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => { const n = !isDark; setIsDark(n); localStorage?.setItem('ADMIN_THEME', n ? 'dark' : 'light'); }}>
          <span>{isDark ? '🌙' : '☀️'}</span>
          <span style={{ fontSize: 13 }}>{isDark ? 'Dark' : 'Light'}</span>
        </div>
      </header>

      <div style={S.tokenBar}>
        <span style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>Admin token:</span>
        <input type="password" value={token} onChange={(e) => setToken(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSaveToken()} placeholder="Paste ADMIN_TOKEN…" style={S.tokenInput} />
        <button type="button" onClick={handleSaveToken} style={S.saveBtn}>Save &amp; Load</button>
        {error && <span style={S.errorMsg}>{error}</span>}
      </div>

      <nav style={S.tabBar}>
        {TABS.map((t) => (
          <button key={t.id} type="button" style={S.tab(tab === t.id)} onClick={() => setTab(t.id)}>
            {t.label}{t.id === 'pending' ? pendingBadge : ''}
          </button>
        ))}
      </nav>

      {tab === 'overview' && (
        <div style={S.mainPanel}>
          <StatsBar stats={stats} pendingTotal={pending?.totalPending} T={T} />
          <p style={{ ...S.muted, marginBottom: 20 }}>
            Use <strong>Pending review</strong> for risk verification, emergency contacts, and deletion requests.
            Open <strong>Appointments</strong> to assign therapists.
          </p>
          {client && <BroadcastPanel client={client} T={T} />}
        </div>
      )}

      {tab === 'analytics' && (
        <div style={S.mainPanel}>
          {client ? <AnalyticsPanel client={client} T={T} /> : <p style={S.muted}>Save admin token to load analytics.</p>}
        </div>
      )}

      {tab === 'appointments' && (
        <div style={S.mainPanel}>
          {client ? (
            <AppointmentsPanel client={client} T={T} onRefresh={() => refreshDashboard(client)} />
          ) : (
            <p style={S.muted}>Save admin token to manage appointments.</p>
          )}
        </div>
      )}

      {tab === 'pending' && (
        <div style={S.mainPanel}>
          <PendingPanel
            pending={pending}
            client={client}
            T={T}
            onRefresh={() => client && refreshDashboard(client)}
            onSelectUser={handleSelectUser}
          />
        </div>
      )}

      {tab === 'users' && (
        <div style={S.body}>
          <div style={S.sidebar}>
            <h2 style={S.sidebarTitle}>Users ({users.length})</h2>
            {users.map((u) => (
              <div key={u.id} onClick={() => handleSelectUser(u)} style={S.userCard(selected?.id === u.id)}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>{u.email}</div>
              </div>
            ))}
          </div>
          <div style={S.detail}>
            {!selected ? (
              <p style={S.empty}>Select a user to view assessments, risk reports, and mood history.</p>
            ) : (
              <>
                <h2 style={S.h2}>{selected.name}</h2>
                <p style={S.muted}>{selected.email}</p>
                <div style={S.actionRow}>
                  <button type="button" style={S.outlineBtn} onClick={openClinicalProfile} disabled={profileLoading}>
                    {profileLoading ? 'Loading…' : 'Full clinical profile'}
                  </button>
                </div>

                <h3 style={S.h3}>AI Intake Assessments</h3>
                {fusions.length === 0 ? <p style={S.empty}>No completed AI intake assessments yet.</p> : (
                  <table style={S.table}>
                    <thead><tr><th style={S.th}>Date</th><th style={S.th}>Risk</th><th style={S.th}>Score</th><th style={S.th}>Emotions</th></tr></thead>
                    <tbody>
                      {fusions.map((f) => (
                        <tr key={f.id}>
                          <td style={S.td}>{new Date(f.createdAt).toLocaleString()}</td>
                          <td style={{ ...S.td, fontWeight: 700, color: RISK_COLORS[f.riskLevel] }}>{f.riskLevel}</td>
                          <td style={S.td}>{typeof f.riskScore === 'number' ? f.riskScore.toFixed(2) : f.riskScore}</td>
                          <td style={S.td}>{(f.primaryEmotions || []).join(', ') || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                <h3 style={S.h3}>Risk Reports</h3>
                {issues.length === 0 ? <p style={S.empty}>No risk reports yet.</p> : (
                  <table style={S.table}>
                    <thead><tr><th style={S.th}>Date</th><th style={S.th}>Category</th><th style={S.th}>Risk</th><th style={S.th}>Status</th><th style={S.th} /></tr></thead>
                    <tbody>
                      {issues.map((r) => (
                        <tr key={r.id}>
                          <td style={S.td}>{new Date(r.createdAt).toLocaleString()}</td>
                          <td style={S.td}>{r.category === 'ai_intake_assessment' ? 'AI Intake' : r.category.replace(/_/g, ' ')}</td>
                          <td style={{ ...S.td, fontWeight: 700, color: RISK_COLORS[r.riskLevel] }}>{r.riskLevel}</td>
                          <td style={S.td}>
                            <span style={S.badge(r.adminVerified)}>{r.adminVerified ? `Verified · ${r.adminAction}` : 'Pending'}</span>
                          </td>
                          <td style={S.td}>
                            {!r.adminVerified && (
                              <button type="button" style={S.verifyBtn} onClick={() => setVerifyTarget(r)}>Verify</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                <h3 style={S.h3}>Mood History</h3>
                {moods.length === 0 ? <p style={S.empty}>No mood entries yet.</p> : (
                  <table style={S.table}>
                    <thead><tr><th style={S.th}>Date</th><th style={S.th}>Rating</th><th style={S.th}>Note</th></tr></thead>
                    <tbody>
                      {moods.map((m) => (
                        <tr key={m.id}>
                          <td style={S.td}>{new Date(m.date).toLocaleDateString()}</td>
                          <td style={{ ...S.td, fontWeight: 700 }}>{m.rating}</td>
                          <td style={S.td}>{m.note || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {verifyTarget && (
        <VerifyModal
          report={verifyTarget}
          T={T}
          onClose={() => setVerifyTarget(null)}
          onConfirm={async (body) => {
            await client.verifyIssue(verifyTarget.id, body);
            setVerifyTarget(null);
            await reloadUserIssues();
          }}
        />
      )}

      {clinicalProfile && (
        <ClinicalProfileModal profile={clinicalProfile} T={T} onClose={() => setClinicalProfile(null)} />
      )}
    </div>
  );
}
