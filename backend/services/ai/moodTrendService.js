const axios = require('axios');
const MoodEntry = require('../../models/MoodEntry');

const ML_SERVER = 'http://127.0.0.1:8000';

/**
 * Calculates a rolling slope (simple linear regression) for mood scores.
 */
function calculateSlope(scores) {
  if (scores.length < 2) return 0;
  const n = scores.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += scores[i];
    sumXY += i * scores[i];
    sumXX += i * i;
  }
  return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
}

/**
 * Calculates standard deviation.
 */
function calculateStd(scores) {
  if (scores.length < 2) return 0;
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const squareDiffs = scores.map(v => Math.pow(v - avg, 2));
  return Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / scores.length);
}

async function assessMoodTrend(userId) {
  try {
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    const moods = await MoodEntry.find({ 
      user: userId, 
      date: { $gte: tenDaysAgo } 
    }).sort({ date: 1 }).lean();

    if (moods.length < 3) {
      // Not enough data for a reliable trend
      return {
        confidence: 0.2,
        riskScore: 0.1,
        riskLevel: 'LOW',
        modelVersion: 'mood-trend-insufficient-data'
      };
    }

    // Scale 1-10 to 0.0-1.0
    const scores = moods.map(m => (Number(m.rating) - 1) / 9);
    // Activities proxy: using note length or 0 if not present
    const activities = moods.map(m => m.note ? m.note.split(' ').length : 0);

    const payload = {
      mood_avg_7d: scores.reduce((a, b) => a + b, 0) / scores.length,
      mood_min_7d: Math.min(...scores),
      mood_max_7d: Math.max(...scores),
      bad_days_7d: scores.filter(s => s <= 0.25).length,
      good_days_7d: scores.filter(s => s >= 0.75).length,
      mood_slope: calculateSlope(scores),
      mood_std_7d: calculateStd(scores),
      activity_avg_7d: activities.reduce((a, b) => a + b, 0) / activities.length,
      weekday_num: new Date().getDay(),
      is_weekend: new Date().getDay() % 6 === 0 ? 1 : 0
    };

    const res = await axios.post(`${ML_SERVER}/analyze/mood-trend`, payload, { timeout: 5000 });
    return {
      confidence: res.data.confidence,
      riskScore: res.data.riskScore,
      riskLevel: res.data.riskLevel,
      features: payload,
      modelVersion: res.data.modelVersion
    };
  } catch (err) {
    console.warn('[MoodTrendAssessment] ML server unreachable or error:', err.message);
    return {
      confidence: 0.1,
      riskScore: 0.2,
      riskLevel: 'LOW',
      modelVersion: 'mood-trend-fallback'
    };
  }
}

module.exports = { assessMoodTrend };
