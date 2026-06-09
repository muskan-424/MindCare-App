/**
 * tinkChat client unit tests — REST payload shaping, WebSocket helpers, capabilities fallback.
 * No real network calls; apiClient and WebSocket are mocked.
 */

jest.mock('../src/utils/apiClient', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
  },
}));

import api from '../src/utils/apiClient';
import { api_route } from '../src/utils/route';
import {
  sendChatMessage,
  refineMessage,
  getCapabilities,
  buildChatWsUrl,
  createChatSocket,
  sendChatSocketMessage,
  getConversations,
  commitDraft,
} from '../src/utils/tinkChat';

class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = MockWebSocket.OPEN;
    this.onmessage = null;
    this.onerror = null;
    MockWebSocket.last = this;
  }

  send = jest.fn();
}
MockWebSocket.OPEN = 1;
MockWebSocket.CLOSED = 3;

describe('tinkChat REST client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('sendChatMessage maps history roles and normalizes the response', async () => {
    api.post.mockResolvedValueOnce({
      data: {
        reply: 'Hello',
        suggestions: ['Tell me more'],
        crisis: false,
        mode: 'rule',
        intent: 'support',
        confidence: 0.8,
        conversationId: 'conv-1',
      },
    });

    const result = await sendChatMessage({
      message: 'Hi',
      history: [{ role: 'user', text: 'Earlier' }],
      language: 'en',
      tone: 'friendly',
    });

    expect(api.post).toHaveBeenCalledWith('/api/chat', expect.objectContaining({
      message: 'Hi',
      history: [{ isUser: true, text: 'Earlier' }],
      language: 'en',
      tone: 'friendly',
    }));
    expect(result.reply).toBe('Hello');
    expect(result.suggestions).toEqual(['Tell me more']);
    expect(result.conversationId).toBe('conv-1');
    expect(result.mode).toBe('rule');
    expect(result.toolTraces).toEqual([]);
  });

  test('sendChatMessage supplies defaults when the API omits optional fields', async () => {
    api.post.mockResolvedValueOnce({ data: {} });
    const result = await sendChatMessage({ message: '?' });
    expect(result.reply).toMatch(/here with you/i);
    expect(result.suggestions).toEqual([]);
    expect(result.crisis).toBe(false);
    expect(result.mood).toBe('neutral');
  });

  test('refineMessage returns refined text from the API', async () => {
    api.post.mockResolvedValueOnce({ data: { text: 'Shorter reply.' } });
    const text = await refineMessage({ text: 'Long reply.', mode: 'shorter' });
    expect(text).toBe('Shorter reply.');
    expect(api.post).toHaveBeenCalledWith('/api/chat/refine', {
      text: 'Long reply.',
      mode: 'shorter',
      language: 'en',
    });
  });

  test('getCapabilities falls back when the request fails', async () => {
    api.get.mockRejectedValueOnce(new Error('offline'));
    const caps = await getCapabilities();
    expect(caps.geminiLive).toBe(false);
    expect(caps.mode).toBe('rule');
    expect(caps.ragMode).toBe('local');
  });

  test('getConversations returns an empty array for non-array payloads', async () => {
    api.get.mockResolvedValueOnce({ data: null });
    await expect(getConversations()).resolves.toEqual([]);
  });

  test('commitDraft posts to the draft endpoint', async () => {
    api.post.mockResolvedValueOnce({ data: { success: true } });
    const result = await commitDraft({
      commit: { method: 'POST', endpoint: '/api/mood', payload: { rating: 4 } },
    });
    expect(api.post).toHaveBeenCalledWith('/api/mood', { rating: 4 });
    expect(result.success).toBe(true);
  });

  test('commitDraft rejects invalid drafts', async () => {
    await expect(commitDraft({})).rejects.toThrow(/invalid draft/i);
  });
});

describe('tinkChat WebSocket helpers', () => {
  beforeEach(() => {
    global.WebSocket = MockWebSocket;
    MockWebSocket.last = null;
  });

  test('buildChatWsUrl converts https to wss and appends token', () => {
    const url = buildChatWsUrl('jwt-token');
    const expectedBase = api_route.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:');
    expect(url).toBe(`${expectedBase}/api/chat/ws?token=jwt-token`);
  });

  test('buildChatWsUrl works without a token', () => {
    const url = buildChatWsUrl();
    expect(url).toMatch(/\/api\/chat\/ws$/);
    expect(url).not.toContain('token=');
  });

  test('createChatSocket dispatches ready and reply events', () => {
    const onReady = jest.fn();
    const onReply = jest.fn();
    const ws = createChatSocket({ token: 't', onReady, onReply });
    expect(ws.url).toContain('/api/chat/ws');

    ws.onmessage({ data: JSON.stringify({ type: 'ready', authenticated: true }) });
    expect(onReady).toHaveBeenCalledWith({ type: 'ready', authenticated: true });

    ws.onmessage({
      data: JSON.stringify({
        type: 'reply',
        reply: 'Hi there',
        suggestions: [],
        mode: 'gemini',
      }),
    });
    expect(onReply).toHaveBeenCalledWith(expect.objectContaining({
      reply: 'Hi there',
      mode: 'gemini',
    }));
  });

  test('sendChatSocketMessage returns false when socket is not open', () => {
    const ws = { readyState: MockWebSocket.CLOSED, send: jest.fn() };
    expect(sendChatSocketMessage(ws, { message: 'Hi' })).toBe(false);
    expect(ws.send).not.toHaveBeenCalled();
  });

  test('sendChatSocketMessage sends a chat frame when connected', () => {
    const ws = { readyState: MockWebSocket.OPEN, send: jest.fn() };
    expect(sendChatSocketMessage(ws, { message: 'Hi', language: 'en' })).toBe(true);
    expect(ws.send).toHaveBeenCalledWith(JSON.stringify({
      type: 'chat',
      message: 'Hi',
      language: 'en',
    }));
  });
});
