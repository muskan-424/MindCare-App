/**
 * chatWs.js — WebSocket transport for Tink agentic chat.
 * Path: /api/chat/ws?token=<optional JWT>
 *
 * Client → server: { type: 'chat', message, history?, conversationId?, language?, tone? }
 * Server → client: { type: 'reply', ...ChatResponse } | { type: 'error', message }
 */
const { WebSocketServer } = require('ws');
const jwt = require('jsonwebtoken');
const url = require('url');
const { config } = require('../../../../config/env');
const { processAgenticChat } = require('../services/chatAgentService');

function parseToken(req) {
  const parsed = url.parse(req.url || '', true);
  const token = parsed.query?.token;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    return decoded.user || null;
  } catch (_) {
    return null;
  }
}

function attachChatWebSocket(server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    const pathname = url.parse(req.url || '').pathname;
    if (pathname !== '/api/chat/ws') {
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  });

  wss.on('connection', (ws, req) => {
    const user = parseToken(req);

    ws.on('message', async (raw) => {
      let payload;
      try {
        payload = JSON.parse(String(raw));
      } catch (_) {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
        return;
      }

      if (payload.type !== 'chat') {
        ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
        return;
      }

      try {
        const reply = await processAgenticChat({
          message: payload.message,
          history: payload.history,
          conversationId: payload.conversationId,
          language: payload.language,
          tone: payload.tone,
          userId: user?.id || null,
        });
        ws.send(JSON.stringify({ type: 'reply', ...reply }));
      } catch (err) {
        ws.send(JSON.stringify({
          type: 'error',
          message: err.status === 400 ? err.message : 'Chat processing failed',
        }));
      }
    });

    ws.send(JSON.stringify({ type: 'ready', authenticated: Boolean(user?.id) }));
  });

  return wss;
}

module.exports = { attachChatWebSocket };
