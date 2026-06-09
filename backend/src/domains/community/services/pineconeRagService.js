/**
 * pineconeRagService.js
 * Optional vector RAG layer over the local help docs. When USE_PINECONE_RAG is
 * enabled and Pinecone + Gemini keys are configured, queries can be answered
 * from vector search; otherwise callers fall back to local token retrieval.
 */

const { config } = require('../../../../config/env');
const { helpDocs } = require('../data/tinkHelpDocs');

let pineconeClient = null;
let pineconeIndex = null;

function isEnabled() {
  return config.ai.usePineconeRag
    && !!config.ai.pineconeApiKey
    && !!config.ai.apiKey;
}

async function getIndex() {
  if (!isEnabled()) return null;
  if (pineconeIndex) return pineconeIndex;
  const { Pinecone } = require('@pinecone-database/pinecone');
  pineconeClient = new Pinecone({ apiKey: config.ai.pineconeApiKey });
  pineconeIndex = pineconeClient.index(config.ai.pineconeIndex);
  return pineconeIndex;
}

async function embedText(text) {
  const apiKey = config.ai.apiKey;
  const model = 'text-embedding-004';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: `models/${model}`,
      content: { parts: [{ text: String(text || '').slice(0, 8000) }] },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || `embed HTTP ${res.status}`);
  const values = data?.embedding?.values;
  if (!Array.isArray(values) || !values.length) throw new Error('empty embedding');
  return values;
}

/**
 * Upsert all local help docs into Pinecone (idempotent by doc id).
 * @returns {Promise<{ upserted: number }>}
 */
async function reindexHelpDocs() {
  const index = await getIndex();
  if (!index) return { upserted: 0, skipped: true };

  const vectors = [];
  for (const doc of helpDocs) {
    const text = `${doc.title}\n${doc.text}`;
    const values = await embedText(text);
    vectors.push({
      id: doc.id,
      values,
      metadata: { title: doc.title, text: doc.text, tags: doc.tags.join(',') },
    });
  }

  // Pinecone upsert in batches of 100
  const batchSize = 100;
  for (let i = 0; i < vectors.length; i += batchSize) {
    await index.upsert(vectors.slice(i, i + batchSize));
  }
  return { upserted: vectors.length };
}

/**
 * Vector search against Pinecone help index.
 * @returns {Promise<Array<{id, title, snippet, text, score}>>}
 */
async function retrieve(query, k = 3) {
  const index = await getIndex();
  if (!index) return [];

  const values = await embedText(query);
  const result = await index.query({
    vector: values,
    topK: k,
    includeMetadata: true,
  });

  return (result.matches || [])
    .filter(m => m.metadata && m.metadata.text)
    .map(m => {
      const text = String(m.metadata.text);
      return {
        id: m.id,
        title: m.metadata.title || m.id,
        snippet: text.length > 160 ? `${text.slice(0, 157)}...` : text,
        text,
        score: m.score || 0,
        source: 'pinecone',
      };
    });
}

module.exports = { isEnabled, retrieve, reindexHelpDocs };
