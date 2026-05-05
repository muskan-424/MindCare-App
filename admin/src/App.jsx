/* global localStorage */
import React, { useCallback, useEffect, useState } from 'react';
import { createAdminClient } from './api';

// ── Theme definitions ─────────────────────────────────────────────────────────
const THEMES = {
  light: {
    bg: '#f5f7fa',
    surface: '#ffffff',
    sidebar: '#ffffff',
    header: '#3a7ca5',
    headerText: '#ffffff',
    border: '#e0e0e0',
    text: '#1a1a2e',
    textMuted: '#666',
    accent: '#e8f4f8',
    accentHover: '#d0eaf5',
    selectedBg: '#d0eaf5',
    tableHead: '#f0f8ff',
    red: '#c0392b',
    btn: '#3a7ca5',
    btnText: '#fff',
    toggleBg: '#e0e0e0',
    toggleKnob: '#fff',
  },
  dark: {
    bg: '#0f0f1a',
    surface: '#1a1a2e',
    sidebar: '#16213e',
    header: '#1a1a2e',
    headerText: '#e0e0ff',
    border: '#2a2a4a',
    text: '#e0e0ff',
    textMuted: '#8888aa',
    accent: '#1e2a45',
    accentHover: '#243255',
    selectedBg: '#243255',
    tableHead: '#1e2a45',
    red: '#ff6b6b',
    btn: '#3a7ca5',
    btnText: '#fff',
    toggleBg: '#3a7ca5',
    toggleKnob: '#fff',
  },
};

export default function App() {
  // ── State ───────────────────────────────────────────────────────────────────
  const [isDark, setIsDark] = useState(() => localStorage?.getItem('ADMIN_THEME') === 'dark');
  const [token, setToken] = useState(localStorage?.getItem('ADMIN_TOKEN') || '');
  const [client, setClient] = useState(null);
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [issues, setIssues] = useState([]);
  const [moods, setMoods] = useState([]);
  const [error, setError] = useState('');

  const T = isDark ? THEMES.dark : THEMES.light;

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage?.setItem('ADMIN_THEME', next ? 'dark' : 'light');
  };

  // ── Client init ─────────────────────────────────────────────────────────────
  const initClient = useCallback((t) => {
    const trimmed = t.trim();
    if (!trimmed) return;
    const c = createAdminClient(trimmed);
    setClient(c);
    c.getUsers()
      .then(setUsers)
      .catch((e) => setError(e.message || 'Failed to load users'));
  }, []);

  useEffect(() => {
    if (token) initClient(token);
  }, [token, initClient]);

  const handleSaveToken = () => {
    localStorage?.setItem('ADMIN_TOKEN', token.trim());
    initClient(token);
  };

  const handleSelectUser = async (u) => {
    setSelected(u);
    if (!client) return;
    try {
      setError('');
      const [iss, mood] = await Promise.all([
        client.getIssuesForUser(u.id),
        client.getMoodForUser(u.id),
      ]);
      setIssues(iss);
      setMoods(mood);
    } catch (e) {
      setError(e.message || 'Failed to load user data');
    }
  };

  // ── Styles (driven by T) ───────────────────────────────────────────────────
  const S = {
    root: {
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: T.bg,
      color: T.text,
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      transition: 'background 0.3s, color 0.3s',
    },
    header: {
      background: T.header,
      color: T.headerText,
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    },
    headerTitle: { margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: 0.5 },
    headerSub: { margin: '2px 0 0', fontSize: 13, opacity: 0.8 },
    toggleWrapper: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      cursor: 'pointer',
      userSelect: 'none',
    },
    toggleTrack: {
      width: 44,
      height: 24,
      borderRadius: 12,
      background: T.toggleBg,
      position: 'relative',
      transition: 'background 0.3s',
    },
    toggleKnob: {
      width: 18,
      height: 18,
      borderRadius: '50%',
      background: T.toggleKnob,
      position: 'absolute',
      top: 3,
      left: isDark ? 23 : 3,
      transition: 'left 0.3s',
      boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
    },
    tokenBar: {
      padding: '10px 24px',
      background: T.surface,
      borderBottom: `1px solid ${T.border}`,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      flexWrap: 'wrap',
    },
    tokenLabel: { fontSize: 13, color: T.textMuted, fontWeight: 500 },
    tokenInput: {
      padding: '6px 10px',
      minWidth: 280,
      borderRadius: 6,
      border: `1px solid ${T.border}`,
      background: T.bg,
      color: T.text,
      fontSize: 13,
      outline: 'none',
    },
    saveBtn: {
      padding: '7px 16px',
      background: T.btn,
      color: T.btnText,
      border: 'none',
      borderRadius: 6,
      cursor: 'pointer',
      fontWeight: 600,
      fontSize: 13,
    },
    body: { flex: 1, display: 'flex', overflow: 'hidden' },
    sidebar: {
      width: '28%',
      minWidth: 200,
      borderRight: `1px solid ${T.border}`,
      overflowY: 'auto',
      background: T.sidebar,
      transition: 'background 0.3s',
    },
    sidebarTitle: {
      padding: '14px 18px 10px',
      margin: 0,
      fontSize: 14,
      fontWeight: 700,
      color: T.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1,
      borderBottom: `1px solid ${T.border}`,
    },
    userCard: (isSelected) => ({
      padding: '10px 18px',
      cursor: 'pointer',
      background: isSelected ? T.selectedBg : 'transparent',
      borderBottom: `1px solid ${T.border}`,
      transition: 'background 0.15s',
    }),
    userName: { fontWeight: 600, fontSize: 14, color: T.text },
    userEmail: { fontSize: 12, color: T.textMuted, marginTop: 2 },
    detail: {
      flex: 1,
      padding: 24,
      overflowY: 'auto',
      background: T.bg,
      transition: 'background 0.3s',
    },
    h2: { fontSize: 20, fontWeight: 700, marginBottom: 4, color: T.text },
    h3: { fontSize: 15, fontWeight: 600, marginTop: 24, marginBottom: 10, color: T.text },
    muted: { fontSize: 13, color: T.textMuted },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
    th: {
      textAlign: 'left',
      padding: '8px 10px',
      background: T.tableHead,
      color: T.textMuted,
      fontWeight: 600,
      borderBottom: `1px solid ${T.border}`,
    },
    td: { padding: '8px 10px', borderBottom: `1px solid ${T.border}`, color: T.text },
    empty: { fontSize: 14, color: T.textMuted, fontStyle: 'italic', marginTop: 8 },
    errorMsg: { color: T.red, fontSize: 13, marginLeft: 4 },
    placeholder: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      color: T.textMuted,
      fontSize: 15,
    },
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={S.root}>
      {/* Header */}
      <header style={S.header}>
        <div>
          <h1 style={S.headerTitle}>MindCare Admin</h1>
          <p style={S.headerSub}>User assessments &amp; mood history</p>
        </div>

        {/* Dark / Light Toggle */}
        <div style={S.toggleWrapper} onClick={toggleTheme} title="Toggle dark/light mode">
          <span style={{ fontSize: 16 }}>{isDark ? '🌙' : '☀️'}</span>
          <div style={S.toggleTrack}>
            <div style={S.toggleKnob} />
          </div>
          <span style={{ fontSize: 13, color: T.headerText, opacity: 0.9 }}>
            {isDark ? 'Dark' : 'Light'}
          </span>
        </div>
      </header>

      {/* Token bar */}
      <div style={S.tokenBar}>
        <span style={S.tokenLabel}>Admin token:</span>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSaveToken()}
          placeholder="Paste your admin JWT token here…"
          style={S.tokenInput}
        />
        <button onClick={handleSaveToken} style={S.saveBtn}>
          Save &amp; Load Users
        </button>
        {error && <span style={S.errorMsg}>{error}</span>}
      </div>

      {/* Body */}
      <div style={S.body}>
        {/* Sidebar — user list */}
        <div style={S.sidebar}>
          <h2 style={S.sidebarTitle}>Users ({users.length})</h2>
          {users.length === 0 && (
            <p style={{ ...S.empty, padding: '12px 18px' }}>No users loaded yet.</p>
          )}
          {users.map((u) => (
            <div
              key={u.id}
              onClick={() => handleSelectUser(u)}
              style={S.userCard(selected?.id === u.id)}
            >
              <div style={S.userName}>{u.name}</div>
              <div style={S.userEmail}>{u.email}</div>
            </div>
          ))}
        </div>

        {/* Detail panel */}
        <div style={S.detail}>
          {!selected ? (
            <div style={S.placeholder}>
              Select a user from the sidebar to view their assessments and mood history.
            </div>
          ) : (
            <>
              <h2 style={S.h2}>{selected.name}</h2>
              <p style={S.muted}>{selected.email}</p>

              {/* Assessments */}
              <h3 style={S.h3}>AI Assessments</h3>
              {issues.length === 0 ? (
                <p style={S.empty}>No assessments yet.</p>
              ) : (
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>Date</th>
                      <th style={S.th}>Category</th>
                      <th style={S.th}>Severity</th>
                      <th style={S.th}>Mood Tag</th>
                      <th style={S.th}>Risk Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issues.map((r) => (
                      <tr key={r.id}>
                        <td style={S.td}>{new Date(r.createdAt).toLocaleString()}</td>
                        <td style={S.td}>{r.category}</td>
                        <td style={S.td}>{r.severity}</td>
                        <td style={S.td}>{r.moodTag || '—'}</td>
                        <td style={{ ...S.td, fontWeight: 700 }}>{r.riskLevel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Mood history */}
              <h3 style={S.h3}>Mood History</h3>
              {moods.length === 0 ? (
                <p style={S.empty}>No mood entries yet.</p>
              ) : (
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>Date</th>
                      <th style={S.th}>Rating</th>
                      <th style={S.th}>Note</th>
                    </tr>
                  </thead>
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
    </div>
  );
}
