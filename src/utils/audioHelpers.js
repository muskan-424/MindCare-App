/**
 * Extract acoustic features from a list of decibel metering values.
 *
 * @param {number[]} dbList Array of decibel levels (usually -160 to 0)
 * @param {number} durationSec Duration of the audio capture in seconds
 * @returns {object} Extracted features
 */
export const extractVoiceFeatures = (dbList, durationSec) => {
  const validDb = (dbList || []).filter(v => typeof v === 'number' && !isNaN(v));
  if (validDb.length === 0) {
    return {
      speechRate: 130,
      pauseRatio: 0.15,
      pitchVariance: 0.30,
      durationSec: durationSec || 5,
      snr: 15,
      energyLevel: 0.5,
    };
  }

  const normalizedAmplitudes = validDb.map(db => {
    const clamped = Math.max(-60, Math.min(0, db));
    return (clamped + 60) / 60;
  });
  const energyLevel = normalizedAmplitudes.reduce((a, b) => a + b, 0) / normalizedAmplitudes.length;

  const sortedDb = [...validDb].sort((a, b) => a - b);
  const noiseIndex = Math.floor(sortedDb.length * 0.1);
  const speechIndex = Math.floor(sortedDb.length * 0.9);
  const noiseDb = sortedDb[noiseIndex];
  const speechDb = sortedDb[speechIndex];
  const snr = Math.max(5, Math.min(35, speechDb - noiseDb));

  const silenceThreshold = Math.max(-50, noiseDb + 5);
  const silentFrames = validDb.filter(db => db < silenceThreshold).length;
  const pauseRatio = silentFrames / validDb.length;

  let peakCount = 0;
  let inSpeech = false;
  for (let i = 0; i < validDb.length; i++) {
    if (validDb[i] >= silenceThreshold) {
      if (!inSpeech) {
        peakCount++;
        inSpeech = true;
      }
    } else {
      inSpeech = false;
    }
  }
  const actualDuration = durationSec || 5;
  let speechRate = Math.round((peakCount / actualDuration) * 60);
  speechRate = Math.max(70, Math.min(220, speechRate));

  const meanAmp = normalizedAmplitudes.reduce((a, b) => a + b, 0) / normalizedAmplitudes.length;
  const ampVar = normalizedAmplitudes.reduce((a, b) => a + Math.pow(b - meanAmp, 2), 0) / normalizedAmplitudes.length;
  const pitchVariance = Math.max(0.1, Math.min(0.6, 0.15 + ampVar * 2));

  return {
    speechRate,
    pauseRatio: Math.round(pauseRatio * 100) / 100,
    pitchVariance: Math.round(pitchVariance * 100) / 100,
    durationSec: Math.round(actualDuration * 10) / 10,
    snr: Math.round(snr * 10) / 10,
    energyLevel: Math.round(energyLevel * 100) / 100,
  };
};
