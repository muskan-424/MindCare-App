function toRiskLevel(score) {
  if (score >= 0.8) return 'CRITICAL';
  if (score >= 0.6) return 'HIGH';
  if (score >= 0.35) return 'MEDIUM';
  return 'LOW';
}

function assessVoicePayload(payload) {
  const speechRate = Number(payload?.speechRate || 0); // words per minute
  const pauseRatio = Number(payload?.pauseRatio || 0); // 0-1
  const pitchVariance = Number(payload?.pitchVariance || 0); // normalized 0-1
  const durationSec = Number(payload?.durationSec || 0);
  const snr = Number(payload?.snr || 0); // dB

  // Simple heuristic until custom model inference is integrated.
  const paceStress = speechRate > 180 || speechRate < 90 ? 0.28 : 0.12;
  const pauseStress = pauseRatio > 0.45 ? 0.3 : pauseRatio > 0.3 ? 0.18 : 0.08;
  const pitchStress = pitchVariance > 0.7 ? 0.25 : pitchVariance > 0.45 ? 0.14 : 0.06;
  const riskScore = Math.max(0, Math.min(1, paceStress + pauseStress + pitchStress));

  const confidenceFromQuality = Math.max(0.2, Math.min(0.95, (snr + 20) / 40));
  const confidenceFromDuration = Math.max(0.2, Math.min(0.95, durationSec / 25));
  const confidence = Math.min(confidenceFromQuality, confidenceFromDuration);

  return {
    confidence,
    riskScore,
    riskLevel: toRiskLevel(riskScore),
    features: {
      speechRate,
      pauseRatio,
      pitchVariance,
      durationSec,
      snr,
    },
    modelVersion: 'voice-v1-stub',
  };
}

module.exports = { assessVoicePayload };
