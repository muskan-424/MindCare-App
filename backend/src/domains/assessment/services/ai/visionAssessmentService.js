function toRiskLevel(score) {
  if (score >= 0.8) return 'CRITICAL';
  if (score >= 0.6) return 'HIGH';
  if (score >= 0.35) return 'MEDIUM';
  return 'LOW';
}

// Risk contribution per ML Kit emotion label (higher = more distress signal).
// A transparent rule rather than a trained model: in the EPAT training data the facial
// emotion label barely predicted mental-health status (every emotion averaged 1.4–1.8 on
// a 0–3 scale), so a model fitted to it scored happy and sad faces almost the same.
// Fusion also weights vision lowest for the same reason.
const NEUTRAL_RISK = 0.25;
const EMOTION_RISK = {
  Happy: 0.10,
  Neutral: NEUTRAL_RISK,
  Sad: 0.60,
  Fear: 0.65,
  Angry: 0.75,
};

function normalizeEmotion(payload) {
  const raw = String(payload?.emotion || '').trim().toLowerCase();
  const label = raw.charAt(0).toUpperCase() + raw.slice(1);
  if (EMOTION_RISK[label] !== undefined) return label;
  // Legacy clients sent expression ratios instead of an emotion label.
  if (payload?.stressExpressionRatio > 0.4) return 'Angry';
  if (payload?.negativeValenceRatio > 0.4) return 'Sad';
  if (payload?.stressExpressionRatio > 0.25) return 'Fear';
  return 'Neutral';
}

function clamp01(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : fallback;
}

/**
 * Scores the on-device ML Kit emotion label the app sends ({ emotion, confidence, faceDetectedRatio }).
 * Detector confidence pulls the score toward neutral rather than toward zero, so an uncertain
 * "Sad" reads as mildly elevated instead of calm.
 */
async function assessVisionPayload(payload) {
  const emotion = normalizeEmotion(payload);
  const emotionConfidence = clamp01(payload?.confidence, 0.5);
  const faceDetectedRatio = clamp01(payload?.faceDetectedRatio, 0.8);

  const riskScore = NEUTRAL_RISK + (EMOTION_RISK[emotion] - NEUTRAL_RISK) * emotionConfidence;
  const confidence = Math.max(0.2, Math.min(0.95, emotionConfidence * faceDetectedRatio));

  return {
    confidence: Number(confidence.toFixed(4)),
    riskScore: Number(riskScore.toFixed(4)),
    riskLevel: toRiskLevel(riskScore),
    features: { emotion, emotionConfidence, faceDetectedRatio },
    modelVersion: 'vision-rules-v2',
  };
}

module.exports = { assessVisionPayload, EMOTION_RISK };
