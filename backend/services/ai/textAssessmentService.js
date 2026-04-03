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

function toRiskLevel(score) {
  if (score >= 0.8) return 'CRITICAL';
  if (score >= 0.6) return 'HIGH';
  if (score >= 0.35) return 'MEDIUM';
  return 'LOW';
}

function assessTextPayload(payload) {
  const responses = Array.isArray(payload?.responses) ? payload.responses : [];
  const combined = responses
    .map((r) => String(r?.text || '').trim())
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

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
      responseCount: responses.length,
    },
    modelVersion: 'text-v1-stub',
  };
}

module.exports = { assessTextPayload };
