import React, { useState } from 'react';

/** Send push/in-app broadcast to all users or a segment. */
export default function BroadcastPanel({ client, T }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState('all_users');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setErr('Title and message are required.');
      return;
    }
    setLoading(true);
    setErr('');
    setMsg('');
    try {
      const res = await client.broadcastNotification({ title: title.trim(), body: body.trim(), audience });
      setMsg(`Broadcast queued for ${res.recipientCount ?? 'all'} recipients.`);
      setTitle('');
      setBody('');
    } catch (ex) {
      setErr(ex.response?.data?.error || ex.message);
    } finally {
      setLoading(false);
    }
  };

  const card = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, maxWidth: 480 };
  const input = {
    display: 'block', width: '100%', margin: '6px 0 12px', padding: 8, boxSizing: 'border-box',
    borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg, color: T.text,
  };

  return (
    <form onSubmit={submit} style={card}>
      <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>Broadcast notification</h4>
      <label style={{ fontSize: 13, fontWeight: 600 }}>Title</label>
      <input value={title} onChange={(e) => setTitle(e.target.value)} style={input} placeholder="MindCare update" />
      <label style={{ fontSize: 13, fontWeight: 600 }}>Audience</label>
      <select value={audience} onChange={(e) => setAudience(e.target.value)} style={input}>
        <option value="all_users">All users</option>
        <option value="therapists">Therapists only</option>
      </select>
      <label style={{ fontSize: 13, fontWeight: 600 }}>Message</label>
      <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} style={{ ...input, resize: 'vertical' }} placeholder="Your wellness tip or announcement…" />
      {err && <p style={{ color: T.red, fontSize: 13 }}>{err}</p>}
      {msg && <p style={{ color: T.green, fontSize: 13 }}>{msg}</p>}
      <button type="submit" disabled={loading} style={{ padding: '8px 16px', background: T.btn, color: T.btnText, border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
        {loading ? 'Sending…' : 'Send broadcast'}
      </button>
    </form>
  );
}
