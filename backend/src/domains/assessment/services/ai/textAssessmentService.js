const axios = require('axios');

const NEGATIVE_TERMS = [
  'hopeless', 'worthless', 'overwhelmed', 'panic',
  'anxious', 'sad', 'stressed', 'tired', 'lonely',
];

const CRITICAL_TERMS = [
  'suicide', 'suicidal', 'kill myself', 'end my life',
  'self-harm', 'self harm', 'want to die',
];

function toRiskLevel(score) {
  if (score >= 0.8) return 'CRITICAL';
  if (score >= 0.6) return 'HIGH';
  if (score >= 0.35) return 'MEDIUM';
  return 'LOW';
}

/**
 * Fallback heuristic logic if Python Server fails
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
  // Extract all text responses and concatenate them into one block for the NLP sentiment model
  const responses = Array.isArray(payload?.responses) ? payload.responses : [];
  const combined = responses
    .map((r) => String(r?.text || '').trim())
    .filter(Boolean)
    .join('. '); // Join with period for NLP sentence boundaries

  if (!combined) {
    return assessTextPayloadHeuristic('', responses.length);
  }

  try {
    // Ping the local Python FastAPI ML Pipeline (.pkl Logistic Regression Text Classifier)
    const res = await axios.post('http://127.0.0.1:8000/analyze/text-local', {
      statement: combined
    }, { timeout: 8000 });

    const aiResult = res.data;
    
    // Check if the heuristic overrides due to obvious critical keywords that the model might miss
    const criticalHits = CRITICAL_TERMS.filter((t) => combined.toLowerCase().includes(t)).length;

    let finalRiskLevel = aiResult.riskLevel;
    let finalRiskScore = aiResult.riskScore;

    if (criticalHits > 0) {
      finalRiskLevel = 'CRITICAL';
      finalRiskScore = Math.max(finalRiskScore, 0.95);
    }

    return {
      confidence: aiResult.confidence || 0.8,
      riskScore: finalRiskScore,
      riskLevel: finalRiskLevel,
      features: {
        responseCount: responses.length,
        textSubmittedLength: combined.length
      },
      modelVersion: aiResult.modelVersion || 'text-tfidf-lr-v1',
    };
  } catch (err) {
    console.warn('Python Text ML Assessment failed, falling back to heuristic:', err.message);
    return assessTextPayloadHeuristic(combined, responses.length);
  }
}

module.exports = { assessTextPayload };
