const { callGeminiAssessment } = require('./geminiAiService');

const NEGATIVE_TERMS = [
  'hopeless',
  'worthless',
  'overwhelmed',
  'panic',
  'anxious',
  'sad',
  'stressed',
  'tired',
  'lonely',
];

const CRITICAL_TERMS = [
  'suicide',
  'suicidal',
  'kill myself',
  'end my life',
  'self-harm',
  'self harm',
  'want to die',
];

const SYSTEM_PROMPT = `You are a clinical mental health assessment AI.
Analyze the user's text check-in and provide a structured JSON assessment.

RESPONSE FORMAT (JSON ONLY):
{
  "riskScore": (float 0-1),
  "riskLevel": ("LOW" | "MEDIUM" | "HIGH" | "CRITICAL"),
  "confidence": (float 0-1),
  "clinicalMarkers": [string],
  "primaryEmotions": [string],
  "explanation": string
}

INSTRUCTIONS:
1. If user mentions self-harm or suicidal ideation, riskLevel MUST be "CRITICAL" and riskScore >= 0.85.
2. Look for signals of anxiety, depression, burnout, or acute stress.
3. Be objective and conservative.`;

function toRiskLevel(score) {
  if (score >= 0.8) return 'CRITICAL';
  if (score >= 0.6) return 'HIGH';
  if (score >= 0.35) return 'MEDIUM';
  return 'LOW';
}

/**
 * Fallback heuristic logic if AI fails
 */
function assessTextPayloadHeuristic(combined, responsesLength) {
  const tokenCount = combined ? combined.split(/\s+/).length : 0;
  const criticalHits = CRITICAL_TERMS.filter((t) => combined.includes(t)).length;
  const negativeHits = NEGATIVE_TERMS.filter((t) => combined.includes(t)).length;
  const stressHints = Math.min(1, (negativeHits + criticalHits * 2) / 8);
  const lengthPenalty = tokenCount < 20 ? 0.08 : 0;
  const riskScore = Math.max(0, Math.min(1, stressHints + lengthPenalty));
  const confidence = Math.max(0.2, Math.min(0.95, tokenCount / 80));

  return {
    confidence,
    riskScore,
    riskLevel: criticalHits > 0 ? 'CRITICAL' : toRiskLevel(riskScore),
    features: {
      tokenCount,
      criticalHits,
      negativeHits,
      responseCount: responsesLength,
    },
    modelVersion: 'text-v1-heuristic',
  };
}

async function assessTextPayload(payload) {
  const responses = Array.isArray(payload?.responses) ? payload.responses : [];
  const combined = responses
    .map((r) => String(r?.text || '').trim())
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (!combined) {
    return assessTextPayloadHeuristic('', responses.length);
  }

  try {
    const aiResult = await callGeminiAssessment(SYSTEM_PROMPT, combined);
    
    return {
      confidence: aiResult.confidence || 0.8,
      riskScore: aiResult.riskScore || 0,
      riskLevel: aiResult.riskLevel || 'LOW',
      features: {
        clinicalMarkers: aiResult.clinicalMarkers || [],
        primaryEmotions: aiResult.primaryEmotions || [],
        explanation: aiResult.explanation || '',
        responseCount: responses.length,
      },
      modelVersion: 'gemini-1.5-flash-v1',
    };
  } catch (err) {
    console.warn('Text AI Assessment failed, falling back to heuristic:', err.message);
    return assessTextPayloadHeuristic(combined, responses.length);
  }
}

module.exports = { assessTextPayload };

