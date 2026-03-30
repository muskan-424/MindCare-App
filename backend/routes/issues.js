const express = require('express');
const router = express.Router();
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const IssueReport = require('../models/IssueReport');
const { auth } = require('../middleware/auth');

const CATEGORIES = [
  'academic_stress',
  'anxiety',
  'relationship',
  'family',
  'finances',
  'health',
  'loneliness',
  'grief',
  'self_esteem',
  'sleep',
  'work_life_balance',
  'other',
];

const CRITICAL_PHRASES = [
  'suicide', 'suicidal', 'kill myself', 'end my life', 'want to die',
  'self-harm', 'self harm', 'hurt myself', 'cut myself',
  'no reason to live', 'better off dead', 'give up',
];

function keywordRisk(text) {
  if (!text || typeof text !== 'string') return { riskLevel: 'LOW', sentimentScore: 0 };
  const lower = text.toLowerCase();
  const isCritical = CRITICAL_PHRASES.some((p) => lower.includes(p));
  if (isCritical) return { riskLevel: 'CRITICAL', sentimentScore: -0.9 };
  const negative = ['hopeless', 'worthless', 'cant go on', 'cant take it', 'overwhelmed', 'panic', 'scared'];
  const hasHigh = negative.some((w) => lower.includes(w));
  if (hasHigh) return { riskLevel: 'HIGH', sentimentScore: -0.6 };
  const medium = ['sad', 'stressed', 'anxious', 'worried', 'tired', 'lonely'];
  const hasMedium = medium.some((w) => lower.includes(w));
  if (hasMedium) return { riskLevel: 'MEDIUM', sentimentScore: -0.3 };
  return { riskLevel: 'LOW', sentimentScore: 0 };
}

async function analyzeWithAI(category, severity, description, moodTag) {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'missing_api_key_placeholder') return null;

  try {
    const llm = new ChatGoogleGenerativeAI({
      modelName: 'gemini-2.5-flash',
      temperature: 0.2,
      apiKey,
    });
    const prompt = `You are a mental health triage assistant. Analyze this report and respond with ONLY valid JSON, no markdown.

Input:
- Category: ${category}
- Severity (1-5): ${severity}
- Description: ${description || '(none)'}
- Mood tag: ${moodTag || '(none)'}

Output JSON (use exactly these keys):
{
  "sentimentScore": <number from -1.0 to 1.0>,
  "riskLevel": "LOW" or "MEDIUM" or "HIGH" or "CRITICAL",
  "emotionTags": ["stress", "anxiety", "low_mood", "loneliness", "anger", "fear", "hopelessness", "other"],
  "recommendations": ["short actionable recommendation 1", "recommendation 2", "recommendation 3"]
}

If the text suggests self-harm, suicide, or immediate danger, set riskLevel to "CRITICAL". Be conservative.`;
    const response = await llm.invoke(prompt);
    let text = '';
    if (response && typeof response.content === 'string') text = response.content;
    else if (response && response.text) text = response.text;
    else text = String(response || '');
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  } catch (e) {
    console.warn('Issue analysis AI error:', e.message);
  }
  return null;
}

router.get('/categories', (_req, res) => {
  res.json({ categories: CATEGORIES });
});

router.post('/report', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { category, severity, description, moodTag } = req.body;
    if (!category || severity == null) {
      return res.status(400).json({ error: 'category and severity are required' });
    }
    const sev = Math.max(1, Math.min(5, Number(severity)));
    const keyword = keywordRisk(description || '');
    let analysis = await analyzeWithAI(category, sev, description || '', moodTag || '');
    if (!analysis) {
      analysis = {
        sentimentScore: keyword.sentimentScore,
        riskLevel: keyword.riskLevel,
        emotionTags: ['stress'],
        recommendations: [
          'Try a short breathing exercise in the app.',
          'Write a few lines in your journal.',
          'Reach out to someone you trust.',
        ],
      };
    }
    if (keyword.riskLevel === 'CRITICAL') {
      analysis.riskLevel = 'CRITICAL';
      analysis.sentimentScore = Math.min(analysis.sentimentScore || 0, -0.8);
    }
    const safetyTriggered = analysis.riskLevel === 'CRITICAL';

    const report = new IssueReport({
      user: userId,
      category,
      severity: sev,
      description: description || '',
      moodTag: moodTag || '',
      sentimentScore: analysis.sentimentScore,
      riskLevel: analysis.riskLevel,
      emotionTags: analysis.emotionTags || [],
      recommendations: analysis.recommendations || [],
      safetyTriggered,
    });
    await report.save();

    res.json({
      reportId: report._id,
      timestamp: report.createdAt,
      sentimentScore: report.sentimentScore,
      riskLevel: report.riskLevel,
      emotionTags: report.emotionTags,
      recommendations: report.recommendations,
      safety: {
        showEmergencyScreen: safetyTriggered,
        helplines: safetyTriggered
          ? [
              { name: 'Vandrevala Foundation', number: '1860-2662-345' },
              { name: 'iCall', number: '9152987821' },
              { name: 'Crisis Text Line', number: 'Text HOME to 741741' },
            ]
          : [],
        showCounselorPrompt: safetyTriggered,
      },
    });
  } catch (err) {
    console.error('Issue report error:', err.message);
    res.status(500).json({ error: 'Failed to save report' });
  }
});

module.exports = router;
