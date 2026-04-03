function toRiskLevel(score) {
  if (score >= 0.8) return 'CRITICAL';
  if (score >= 0.6) return 'HIGH';
  if (score >= 0.35) return 'MEDIUM';
  return 'LOW';
}

function assessVisionPayload(payload) {
  const faceDetectedRatio = Number(payload?.faceDetectedRatio || 0); // 0-1
  const lowLightRatio = Number(payload?.lowLightRatio || 0); // 0-1
  const stressExpressionRatio = Number(payload?.stressExpressionRatio || 0); // 0-1
  const negativeValenceRatio = Number(payload?.negativeValenceRatio || 0); // 0-1
  const frameCount = Number(payload?.frameCount || 0);

  const riskScore = Math.max(
    0,
    Math.min(1, stressExpressionRatio * 0.55 + negativeValenceRatio * 0.45)
  );

  const trackQuality = Math.max(0, Math.min(1, faceDetectedRatio * (1 - lowLightRatio)));
  const frameQuality = Math.max(0.2, Math.min(0.95, frameCount / 200));
  const confidence = Math.min(trackQuality, frameQuality);

  return {
    confidence,
    riskScore,
    riskLevel: toRiskLevel(riskScore),
    features: {
      faceDetectedRatio,
      lowLightRatio,
      stressExpressionRatio,
      negativeValenceRatio,
      frameCount,
    },
    modelVersion: 'vision-v1-stub',
  };
}

module.exports = { assessVisionPayload };
