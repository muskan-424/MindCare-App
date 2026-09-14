const axios = require('axios');

const ML_SERVER = require('../../../../shared/mlServerUrl');

function toRiskLevel(score) {
  if (score >= 0.8) return 'CRITICAL';
  if (score >= 0.6) return 'HIGH';
  if (score >= 0.35) return 'MEDIUM';
  return 'LOW';
}

// Baseline risk contribution per ML Kit emotion label (higher = more distress signal).
const EMOTION_RISK = {
  Happy: 0.10,
  Neutral: 0.25,
  Sad: 0.60,
  Fear: 0.65,
  Angry: 0.75,
};

/**
 * Heuristic fallback — used when the Python ML server is unreachable.
 * Scores off the on-device ML Kit emotion label + confidence the app actually sends
 * (emotion, confidence, faceDetectedRatio) rather than the legacy simulated-frame fields.
 */
function assessVisionHeuristic(payload) {
  const emotion            = payload?.emotion || 'Neutral';
  const emotionConfidence  = Math.max(0, Math.min(1, Number(payload?.confidence || 0.5)));
  const faceDetectedRatio  = Math.max(0, Math.min(1, Number(payload?.faceDetectedRatio || 0)));

  const baseRisk   = EMOTION_RISK[emotion] ?? EMOTION_RISK.Neutral;
  // Weight the emotion's risk contribution by how confident the detector was in it.
  const riskScore  = Math.max(0, Math.min(1, baseRisk * emotionConfidence));
  const confidence = Math.max(0.2, Math.min(0.95, emotionConfidence * faceDetectedRatio));

  return {
    confidence,
    riskScore,
    riskLevel: toRiskLevel(riskScore),
    features: { emotion, emotionConfidence, faceDetectedRatio },
    modelVersion: 'vision-v1-heuristic-fallback',
  };
}

/**
 * Primary path: calls the Python ML server /analyze/vision endpoint.
 * Falls back to local heuristics if the ML server is unreachable.
 */
async function assessVisionPayload(payload) {
  // Map simulated frontend data to the new ML Vision Model format
  let emotion = payload?.emotion || 'Neutral';
  if (!payload?.emotion) {
    if (payload?.stressExpressionRatio > 0.4) emotion = 'Angry';
    else if (payload?.negativeValenceRatio > 0.4) emotion = 'Sad';
    else if (payload?.stressExpressionRatio > 0.25) emotion = 'Fear';
  }

  const body = {
    emotion: emotion,
    confidence: Number(payload?.confidence || 0.8),
    faceDetectedRatio: Number(payload?.faceDetectedRatio || 0.8)
  };

  try {
    const response = await axios.post(`${ML_SERVER}/analyze/vision`, body, { timeout: 5000 });
    const d = response.data;
    return {
      confidence:   d.confidence,
      riskScore:    d.riskScore,
      riskLevel:    d.riskLevel,
      features:     d.features || body,
      modelVersion: d.modelVersion,
    };
  } catch (err) {
    console.warn('[VisionAssessment] Python ML server unreachable, falling back to heuristic:', err.message);
    return assessVisionHeuristic(payload);
  }
}

module.exports = { assessVisionPayload };
