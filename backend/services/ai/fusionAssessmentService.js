function toRiskLevel(score) {
  if (score >= 0.8) return 'CRITICAL';
  if (score >= 0.6) return 'HIGH';
  if (score >= 0.35) return 'MEDIUM';
  return 'LOW';
}

function buildRecommendations(level) {
  if (level === 'CRITICAL') {
    return [
      'Open emergency support resources immediately.',
      'Use grounding exercise and connect to a trusted person now.',
      'Start a live conversation with Tink or a counselor.',
    ];
  }
  if (level === 'HIGH') {
    return [
      'Start a guided breathing or grounding exercise now.',
      'Schedule a therapist session within 24-48 hours.',
      'Reduce cognitive load and use short check-ins today.',
    ];
  }
  if (level === 'MEDIUM') {
    return [
      'Complete a 10-minute mindfulness routine.',
      'Journal key stress triggers from today.',
      'Check in again later to track recovery trend.',
    ];
  }
  return [
    'Keep a light self-care rhythm and short check-ins.',
    'Continue healthy routines and sleep hygiene.',
    'Track mood consistency over the week.',
  ];
}

function fuseAssessment(featureVector) {
  const text = featureVector?.text || {};
  const voice = featureVector?.voice || {};
  const vision = featureVector?.vision || {};

  const wText = 0.50; // Text is now Gemini-driven (higher weight)
  const wVoice = 0.25; // Stub/Heuristic
  const wVision = 0.25; // Stub/Heuristic

  const riskScore = Math.max(
    0,
    Math.min(
      1,
      (Number(text.riskScore || 0) * wText) +
        (Number(voice.riskScore || 0) * wVoice) +
        (Number(vision.riskScore || 0) * wVision)
    )
  );

  const confidence = Math.max(
    0,
    Math.min(
      1,
      (Number(text.confidence || 0) * wText) +
        (Number(voice.confidence || 0) * wVoice) +
        (Number(vision.confidence || 0) * wVision)
    )
  );

  const contradictionFlags = [];
  const textVsVisionGap = Math.abs(Number(text.riskScore || 0) - Number(vision.riskScore || 0));
  const voiceVsVisionGap = Math.abs(Number(voice.riskScore || 0) - Number(vision.riskScore || 0));
  if (textVsVisionGap > 0.45) contradictionFlags.push('text_vision_mismatch');
  if (voiceVsVisionGap > 0.45) contradictionFlags.push('voice_vision_mismatch');

  const riskLevel = toRiskLevel(riskScore);
  const recommendations = buildRecommendations(riskLevel);

  return {
    riskScore,
    riskLevel,
    confidence,
    contradictionFlags,
    aiMarkers: text.features?.clinicalMarkers || [],
    primaryEmotions: text.features?.primaryEmotions || [],
    recommendations,
    modelVersion: 'fusion-v2-gemini',
  };
}

module.exports = { fuseAssessment };
