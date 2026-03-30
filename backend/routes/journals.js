const express = require('express');
const router = express.Router();
const JournalEntry = require('../models/JournalEntry');
const { auth } = require('../middleware/auth');

async function analyzeJournalSentiment(content) {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'missing_api_key_placeholder') return null;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const prompt = `Analyze this journal entry and reply with ONLY valid JSON, no markdown.

Journal: "${content.slice(0, 800)}"

Output JSON (use exactly these keys):
{
  "sentimentScore": <number from -1.0 (very negative) to 1.0 (very positive)>,
  "emotionTags": ["one", "or", "more", "from: joy, sadness, anxiety, anger, hope, confusion, loneliness, gratitude, stress, calm"],
  "riskLevel": "LOW" or "MEDIUM" or "HIGH" or "CRITICAL",
  "aiInsight": "<one warm, empathetic sentence acknowledging their feelings>"
}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 256 },
      }),
    });
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  } catch (e) {
    console.warn('Journal AI analysis failed:', e.message);
  }
  return null;
}

// GET /api/journals — fetch user's journal entries
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const entries = await JournalEntry.find({ user: userId })
      .sort({ date: -1 })
      .limit(100)
      .lean();
    res.json(
      entries.map((e) => ({
        id: e._id,
        date: new Date(e.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
        time: new Date(e.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        content: e.content,
        sentimentScore: e.sentimentScore,
        emotionTags: e.emotionTags,
        riskLevel: e.riskLevel,
        aiInsight: e.aiInsight,
      }))
    );
  } catch (err) {
    console.error('Error fetching journals:', err.message);
    res.status(500).json({ error: 'Failed to load journals' });
  }
});

// POST /api/journals — create a journal entry with AI sentiment analysis
router.post('/', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const userId = req.user.id;
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'content is required' });
    }

    // Run AI analysis in parallel with saving
    const [entry, aiResult] = await Promise.all([
      new JournalEntry({ user: userId, content: content.trim() }).save(),
      analyzeJournalSentiment(content.trim()),
    ]);

    // If AI result arrived, persist it
    if (aiResult) {
      entry.sentimentScore = aiResult.sentimentScore;
      entry.emotionTags = aiResult.emotionTags || [];
      entry.riskLevel = aiResult.riskLevel || 'LOW';
      entry.aiInsight = aiResult.aiInsight || '';
      await entry.save();
    }

    res.json({
      id: entry._id,
      date: new Date(entry.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      time: new Date(entry.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      content: entry.content,
      sentimentScore: entry.sentimentScore,
      emotionTags: entry.emotionTags,
      riskLevel: entry.riskLevel,
      aiInsight: entry.aiInsight,
    });
  } catch (err) {
    console.error('Error creating journal:', err.message);
    res.status(500).json({ error: 'Failed to save journal' });
  }
});

// DELETE /api/journals/:id — delete a journal entry
router.delete('/:id', auth, async (req, res) => {
  try {
    const entry = await JournalEntry.findOne({ _id: req.params.id, user: req.user.id });
    if (!entry) return res.status(404).json({ error: 'Journal entry not found' });
    await entry.deleteOne();
    res.json({ success: true });
  } catch (err) {
    console.error('Journal delete error:', err.message);
    res.status(500).json({ error: 'Failed to delete journal' });
  }
});

module.exports = router;
