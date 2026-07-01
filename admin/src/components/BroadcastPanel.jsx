import React, { useState } from 'react';
import { useTranslation } from '../i18n.jsx';

export default function BroadcastPanel({ client, T }) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState('all_users');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setErr(t('web.broadcast_required'));
      return;
    }
    setLoading(true);
    setErr('');
    try {
      const res = await client.broadcastNotification({ title, body, audience });
      setMsg(t('web.broadcast_sent', { count: res.recipientCount }));
      setTitle('');
      setBody('');
    } catch (ex) {
      setErr(ex.response?.data?.error || ex.message);
    }
    setLoading(false);
  };

  const input = {
    display: 'block', width: '100%', margin: '6px 0 12px', padding: 8, boxSizing: 'border-box',
    borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg, color: T.text,
  };

  return (
    <form onSubmit={submit} style={{ maxWidth: 480, marginTop: 24 }}>
      <h3 style={{ fontSize: 16, marginBottom: 12 }}>{t('admin.new_broadcast')}</h3>
      <label style={{ fontSize: 13, fontWeight: 600 }}>{t('web.broadcast_title_label')}</label>
      <input value={title} onChange={(e) => setTitle(e.target.value)} style={input} placeholder={t('web.broadcast_title_ph')} />
      <label style={{ fontSize: 13, fontWeight: 600 }}>{t('web.broadcast_audience')}</label>
      <select value={audience} onChange={(e) => setAudience(e.target.value)} style={input}>
        <option value="all_users">{t('web.broadcast_all_users')}</option>
        <option value="therapists">{t('web.broadcast_therapists')}</option>
      </select>
      <label style={{ fontSize: 13, fontWeight: 600 }}>{t('web.broadcast_body')}</label>
      <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} style={{ ...input, resize: 'vertical' }} placeholder={t('web.broadcast_body_ph')} />
      {err && <p style={{ color: T.red, fontSize: 13 }}>{err}</p>}
      {msg && <p style={{ color: T.green, fontSize: 13 }}>{msg}</p>}
      <button type="submit" disabled={loading} style={{ padding: '8px 16px', background: T.btn, color: T.btnText, border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
        {loading ? t('web.broadcast_sending') : t('web.broadcast_send')}
      </button>
    </form>
  );
}
