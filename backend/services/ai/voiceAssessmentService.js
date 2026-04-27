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
function assessVoiceHeuristic(payload) {
  const speechRate    = Number(payload?.speechRate    || 0);
  const pauseRatio    = Number(payload?.pauseRatio    || 0);
  const pitchVariance = Number(payload?.pitchVariance || 0);
  const durationSec   = Number(payload?.durationSec   || 0);
  const snr           = Number(payload?.snr           || 0);

  const paceStress  = speechRate > 180 || speechRate < 80 ? 0.32 : 0.12;
  const pauseStress = pauseRatio > 0.45 ? 0.30 : pauseRatio > 0.30 ? 0.18 : 0.08;
  const pitchStress = pitchVariance < 0.10 ? 0.30 : pitchVariance > 0.75 ? 0.25 : 0.06;
  const riskScore   = Math.max(0, Math.min(1, paceStress + pauseStress + pitchStress));

  const snrNorm  = Math.max(0.2, Math.min(0.95, (snr + 20) / 45));
  const durNorm  = Math.max(0.2, Math.min(0.95, durationSec / 20));
  const confidence = Math.min(snrNorm, durNorm);

  return {
    confidence,
    riskScore,
    riskLevel: toRiskLevel(riskScore),
    features: { speechRate, pauseRatio, pitchVariance, durationSec, snr },
    modelVersion: 'voice-v1-heuristic-fallback',
  };
}

/**
 * Primary path: calls the Python ML server /analyze/voice endpoint.
 * Falls back to local heuristics if the ML server is unreachable.
 */
async function assessVoicePayload(payload) {
  const body = {
    speechRate:    Number(payload?.speechRate    || 130),
    pauseRatio:    Number(payload?.pauseRatio    || 0.15),
    pitchVariance: Number(payload?.pitchVariance || 0.30),
    durationSec:   Number(payload?.durationSec   || 5),
    snr:           Number(payload?.snr           || 15),
    energyLevel:   Number(payload?.energyLevel   || 0.5),
  };

  try {
    const response = await axios.post(`${ML_SERVER}/analyze/voice`, body, { timeout: 5000 });
    const d = response.data;
    return {
      confidence:   d.confidence,
      riskScore:    d.riskScore,
      riskLevel:    d.riskLevel,
      features:     d.features,
      modelVersion: d.modelVersion,
    };
  } catch (err) {
    console.warn('[VoiceAssessment] Python ML server unreachable, falling back to heuristic:', err.message);
    return assessVoiceHeuristic(payload);
  }
}

module.exports = { assessVoicePayload };
