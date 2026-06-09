/**
 * tinkRagService.js
 * Hybrid Retrieval-Augmented Generation for Tink.
 *
 * Default: local token-overlap retriever (always available, no API keys).
 * When USE_PINECONE_RAG=true: merges Pinecone vector hits with local results
 * so help answers stay grounded even if the vector store is empty or down.
 */

const { helpDocs } = require('../data/tinkHelpDocs');
const pineconeRag = require('./pineconeRagService');

const STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'do', 'does', 'how', 'what', 'why', 'can', 'i',
  'me', 'my', 'you', 'your', 'to', 'of', 'in', 'on', 'for', 'and', 'or', 'it',
  'this', 'that', 'with', 'about', 'tell', 'show', 'please', 'work', 'works',
]);

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1 && !STOPWORDS.has(t));
}

function scoreDoc(queryTokens, queryRaw, doc) {
  let score = 0;
  const haystack = `${doc.title} ${doc.text}`.toLowerCase();

  for (const tok of queryTokens) {
    if (doc.tags.some(tag => tag.includes(tok) || tok.includes(tag))) score += 3;
    if (haystack.includes(tok)) score += 1;
  }

  for (const tag of doc.tags) {
    if (tag.includes(' ') && queryRaw.includes(tag)) score += 4;
  }

  return score;
}

function retrieveLocal(query, k = 3) {
  const queryRaw = String(query || '').toLowerCase();
  const queryTokens = tokenize(query);
  if (!queryTokens.length) return [];

  const scored = helpDocs
    .map(doc => ({ doc, score: scoreDoc(queryTokens, queryRaw, doc) }))
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);

  return scored.map(s => ({
    id: s.doc.id,
    title: s.doc.title,
    snippet: s.doc.text.length > 160 ? `${s.doc.text.slice(0, 157)}...` : s.doc.text,
    text: s.doc.text,
    score: s.score,
    source: 'local',
  }));
}

function mergeResults(local, vector, k) {
  const byId = new Map();
  for (const hit of [...vector, ...local]) {
    const prev = byId.get(hit.id);
    if (!prev || hit.score > prev.score) byId.set(hit.id, hit);
  }
  return [...byId.values()].sort((a, b) => b.score - a.score).slice(0, k);
}

/**
 * Retrieve the most relevant help chunks for a query (hybrid when enabled).
 * @param {string} query
 * @param {number} k
 * @returns {Promise<Array<{id, title, snippet, text, score, source?}>>}
 */
async function retrieve(query, k = 3) {
  const local = retrieveLocal(query, k);
  if (!pineconeRag.isEnabled()) return local;

  try {
    const vector = await pineconeRag.retrieve(query, k);
    return mergeResults(local, vector, k);
  } catch (err) {
    if (process.env.NODE_ENV !== 'test') {
      // eslint-disable-next-line no-console
      console.warn('[rag] Pinecone retrieval failed, using local docs:', err.message);
    }
    return local;
  }
}

module.exports = { retrieve, retrieveLocal, reindexHelpDocs: pineconeRag.reindexHelpDocs };
