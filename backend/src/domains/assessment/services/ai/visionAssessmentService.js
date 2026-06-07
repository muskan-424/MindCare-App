const axios = require('axios');

const ML_SERVER = 'http://127.0.0.1:8000';

function toRiskLevel(score) {
  if (score >= 0.8) return 'CRITICAL';
  if (score >= 0.6) return 'HIGH';
  if (score >= 0.35) return 'MEDIUM';
  return 'LOW';
}

/**
 * Heuristic fallback — used when the Python ML server is unreachable.
 */
function assessVisionHeuristic(payload) {
  const faceDetectedRatio      = Number(payload?.faceDetectedRatio      || 0);
  const lowLightRatio          = Number(payload?.lowLightRatio          || 0);
  const stressExpressionRatio  = Number(payload?.stressExpressionRatio  || 0);
  const negativeValenceRatio   = Number(payload?.negativeValenceRatio   || 0);
  const frameCount             = Number(payload?.frameCount             || 0);

  const riskScore     = Math.max(0, Math.min(1, stressExpressionRatio * 0.55 + negativeValenceRatio * 0.45));
  const trackQuality  = Math.max(0, Math.min(1, faceDetectedRatio * (1 - lowLightRatio)));
  const frameQuality  = Math.max(0.2, Math.min(0.95, frameCount / 150));
  const confidence    = Math.min(trackQuality, frameQuality);

  return {
    confidence,
    riskScore,
    riskLevel: toRiskLevel(riskScore),
    features: { faceDetectedRatio, lowLightRatio, stressExpressionRatio, negativeValenceRatio, frameCount },
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
