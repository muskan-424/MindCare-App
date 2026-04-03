/* global localStorage */
import React, { useCallback, useEffect, useState } from 'react';
import { createAdminClient } from './api';
import { colors } from './theme';

export default function App() {
  const [token, setToken] = useState(localStorage?.getItem('ADMIN_TOKEN') || '');
  const [client, setClient] = useState(null);
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [issues, setIssues] = useState([]);
  const [moods, setMoods] = useState([]);
  const [error, setError] = useState('');

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
    if (token) {
      initClient(token);
    }
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

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f5f5' }}>
      <header style={{ background: colors.primary, color: colors.white, padding: '12px 20px' }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>MindCare Admin</h1>
        <p style={{ margin: 0, fontSize: 13 }}>User assessments &amp; mood history</p>
      </header>

      <div style={{ padding: '10px 20px', background: colors.cream, borderBottom: `1px solid ${colors.gray3}` }}>
        <label style={{ fontSize: 13, marginRight: 8 }}>Admin token:</label>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          style={{ padding: 6, minWidth: 260, marginRight: 8, borderRadius: 4, border: `1px solid ${colors.gray3}` }}
        />
        <button
          onClick={handleSaveToken}
          style={{
            padding: '6px 12px',
            background: colors.secondary,
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          Save &amp; Load Users
        </button>
        {error && <span style={{ marginLeft: 12, color: colors.redPink }}>{error}</span>}
      </div>

      <div style={{ flex: 1, display: 'flex' }}>
        {/* Users list */}
        <div
          style={{
            width: '30%',
            borderRight: `1px solid ${colors.gray3}`,
            overflowY: 'auto',
            background: colors.cream,
          }}
        >
          <h2 style={{ padding: '10px 16px', margin: 0, fontSize: 16, color: colors.secondary }}>Users</h2>
          {users.map((u) => (
            <div
              key={u.id}
              onClick={() => handleSelectUser(u)}
              style={{
                padding: '8px 16px',
                cursor: 'pointer',
                background: selected?.id === u.id ? colors.accent : 'transparent',
                borderBottom: `1px solid ${colors.gray3}`,
              }}
            >
              <div style={{ fontWeight: 600, color: colors.secondary }}>{u.name}</div>
              <div style={{ fontSize: 12, color: colors.gray }}>{u.email}</div>
            </div>
          ))}
        </div>

        {/* Details */}
        <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
          {!selected ? (
            <p style={{ color: colors.gray }}>Select a user to view assessments and mood history.</p>
          ) : (
            <>
              <h2 style={{ fontSize: 18, marginBottom: 4 }}>{selected.name}</h2>
              <p style={{ fontSize: 13, color: colors.gray }}>{selected.email}</p>

              <h3 style={{ marginTop: 16, fontSize: 16 }}>AI Assessments</h3>
              {issues.length === 0 ? (
                <p style={{ fontSize: 13, color: colors.gray }}>No assessments yet.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: colors.accent }}>
                      <th style={{ textAlign: 'left', padding: 6 }}>Date</th>
                      <th style={{ textAlign: 'left', padding: 6 }}>Category</th>
                      <th style={{ textAlign: 'left', padding: 6 }}>Severity</th>
                      <th style={{ textAlign: 'left', padding: 6 }}>MoodTag</th>
                      <th style={{ textAlign: 'left', padding: 6 }}>Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issues.map((r) => (
                      <tr key={r.id}>
                        <td style={{ padding: 6 }}>{new Date(r.createdAt).toLocaleString()}</td>
                        <td style={{ padding: 6 }}>{r.category}</td>
                        <td style={{ padding: 6 }}>{r.severity}</td>
                        <td style={{ padding: 6 }}>{r.moodTag || '-'}</td>
                        <td style={{ padding: 6, fontWeight: 600 }}>{r.riskLevel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <h3 style={{ marginTop: 16, fontSize: 16 }}>Mood history</h3>
              {moods.length === 0 ? (
                <p style={{ fontSize: 13, color: colors.gray }}>No mood entries yet.</p>
              ) : (
                <ul style={{ paddingLeft: 18 }}>
                  {moods.map((m) => (
                    <li key={m.id} style={{ marginBottom: 4 }}>
                      <strong>{new Date(m.date).toLocaleDateString()}</strong> – rating {m.rating}
                      {m.note ? ` – "${m.note}"` : ''}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

