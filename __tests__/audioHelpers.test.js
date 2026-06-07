import { extractVoiceFeatures } from '../src/utils/audioHelpers';

describe('extractVoiceFeatures', () => {
  it('returns fallback/default values for empty or invalid inputs', () => {
    const fallback = extractVoiceFeatures([], 5);
    expect(fallback).toEqual({
      speechRate: 130,
      pauseRatio: 0.15,
      pitchVariance: 0.30,
      durationSec: 5,
      snr: 15,
      energyLevel: 0.5,
    });

    const fallbackNull = extractVoiceFeatures(null, 0);
    expect(fallbackNull).toEqual({
      speechRate: 130,
      pauseRatio: 0.15,
      pitchVariance: 0.30,
      durationSec: 5,
      snr: 15,
      energyLevel: 0.5,
    });

    const fallbackNaN = extractVoiceFeatures([NaN, undefined, null], 3);
    expect(fallbackNaN).toEqual({
      speechRate: 130,
      pauseRatio: 0.15,
      pitchVariance: 0.30,
      durationSec: 3,
      snr: 15,
      energyLevel: 0.5,
    });
  });

  it('calculates energyLevel based on normalized amplitudes', () => {
    // -30dB should normalize to (-30 + 60) / 60 = 0.5
    const features = extractVoiceFeatures([-30, -30, -30], 5);
    expect(features.energyLevel).toBe(0.5);

    // 0dB should normalize to (0 + 60) / 60 = 1.0
    const featuresLoud = extractVoiceFeatures([0, 0, 0], 5);
    expect(featuresLoud.energyLevel).toBe(1.0);

    // -60dB (or lower) should clamp and normalize to (-60 + 60) / 60 = 0.0
    const featuresQuiet = extractVoiceFeatures([-60, -70, -80], 5);
    expect(featuresQuiet.energyLevel).toBe(0.0);
  });

  it('calculates signal-to-noise ratio (snr)', () => {
    // Sort array: [-50 (10th percentile), ..., -20 (90th percentile)]
    // -20 - (-50) = 30 dB SNR
    const dbList = [
      -50, -50, -50, -40, -40, -30, -30, -20, -20, -20
    ];
    const features = extractVoiceFeatures(dbList, 5);
    expect(features.snr).toBe(30);
  });

  it('clamps snr to range [5, 35]', () => {
    // SNR calculated as: speechDb - noiseDb
    // High SNR case: 0dB and -100dB
    const highSNRList = [-100, -100, -50, -20, 0, 0, 0, 0, 0, 0];
    const featuresHigh = extractVoiceFeatures(highSNRList, 5);
    expect(featuresHigh.snr).toBe(35);

    // Low SNR case: all same db
    const featuresLow = extractVoiceFeatures([-30, -30, -30], 5);
    expect(featuresLow.snr).toBe(5);
  });

  it('calculates pauseRatio correctly', () => {
    // noiseDb at 10% index. For below list: sorted is [-55, -55, -40, -20, -20, -20, -20, -20, -20, -20]
    // 10th percentile is -55dB.
    // silenceThreshold = max(-50, noiseDb + 5) = max(-50, -55 + 5) = max(-50, -50) = -50dB.
    // Values below -50dB: -55, -55. (2 values out of 10 = 0.20)
    const dbList = [-55, -55, -40, -20, -20, -20, -20, -20, -20, -20];
    const features = extractVoiceFeatures(dbList, 5);
    expect(features.pauseRatio).toBe(0.2);
  });

  it('estimates speechRate and clamps it', () => {
    // Test with signals going above and below threshold to trigger speech rate peaks.
    // silenceThreshold will be -50dB.
    // Peaks should trigger when moving from quiet (< -50dB) to loud (>= -50dB).
    // Let's create two peaks in a 2-second clip:
    // [quiet, peak1, quiet, peak2]
    const dbList = [-60, -20, -60, -20];
    const features = extractVoiceFeatures(dbList, 2);
    // peakCount = 2
    // actualDuration = 2
    // speechRate = (2 / 2) * 60 = 60 -> clamped to min 70
    expect(features.speechRate).toBe(70);

    // Create many peaks to trigger clamping to max 220
    // 10 peaks in 1 second:
    const manyPeaks = [];
    for (let i = 0; i < 10; i++) {
      manyPeaks.push(-60);
      manyPeaks.push(-20);
    }
    const featuresHigh = extractVoiceFeatures(manyPeaks, 1);
    // peakCount = 10
    // speechRate = (10 / 1) * 60 = 600 -> clamped to max 220
    expect(featuresHigh.speechRate).toBe(220);
  });

  it('estimates pitchVariance based on amplitude variance', () => {
    const features = extractVoiceFeatures([-30, -30, -30], 5);
    // Zero variance: ampVar = 0, pitchVariance = max(0.1, min(0.6, 0.15 + 0 * 2)) = 0.15
    expect(features.pitchVariance).toBe(0.15);
  });
});
