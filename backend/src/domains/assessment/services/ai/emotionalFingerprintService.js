const MoodEntry = require('../../../wellness/models/MoodEntry');
const IssueReport = require('../../../admin/models/IssueReport');
const AssessmentFusionResult = require('../../models/AssessmentFusionResult');
const Profile = require('../../../identity/models/Profile');

/**
 * Generates a personalized Emotional Pattern Fingerprint for a user.
 */
async function generateEmotionalFingerprint(userId) {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [moods, reports, fusionResults, profile] = await Promise.all([
      MoodEntry.find({ user: userId, date: { $gte: thirtyDaysAgo } }).sort({ date: 1 }).lean(),
      IssueReport.find({ user: userId, createdAt: { $gte: thirtyDaysAgo } }).lean(),
      AssessmentFusionResult.find({ user: userId, createdAt: { $gte: thirtyDaysAgo } }).lean(),
      Profile.findOne({ userId }).lean()
    ]);

    // --- 1. Recovery Velocity ---
    // Measure time taken to recover from a mood dip (rating <= 3) to baseline (rating >= 6)
    let recoveryTimes = [];
    let dipStartedAt = null;

    moods.forEach(m => {
      if (m.rating <= 3 && !dipStartedAt) {
        dipStartedAt = m.date;
      } else if (m.rating >= 6 && dipStartedAt) {
        const diffHours = (new Date(m.date) - new Date(dipStartedAt)) / (1000 * 60 * 60);
        recoveryTimes.push(diffHours);
        dipStartedAt = null;
      }
    });

    const avgRecoveryVelocity = recoveryTimes.length 
      ? (recoveryTimes.reduce((a, b) => a + b, 0) / recoveryTimes.length).toFixed(1) 
      : null;

    // --- 2. Stress Heatmap (Day of Week) ---
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const heatmap = { 'Sun': 0, 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0 };
    reports.forEach(r => {
      const day = dayNames[new Date(r.createdAt).getDay()];
      heatmap[day]++;
    });

    // --- 3. Common Triggers ---
    const triggerCounts = {};
    reports.forEach(r => {
      triggerCounts[r.category] = (triggerCounts[r.category] || 0) + 1;
    });
    const commonTriggers = Object.entries(triggerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name: name.replace(/_/g, ' '), count }));

    // --- 4. Burnout Risk Index ---
    const recentFusionScores = fusionResults.map(f => f.riskScore);
    const avgRisk = recentFusionScores.length 
      ? (recentFusionScores.reduce((a, b) => a + b, 0) / recentFusionScores.length).toFixed(2)
      : 0;

    // --- 5. Sentiment Stability ---
    const sentiments = reports.filter(r => r.sentimentScore !== null).map(r => r.sentimentScore);
    const sentimentVariance = sentiments.length > 1
      ? Math.sqrt(sentiments.reduce((s, v) => s + Math.pow(v - (sentiments.reduce((a,b)=>a+b)/sentiments.length), 2), 0) / sentiments.length).toFixed(2)
      : 0;

    return {
      userId,
      generatedAt: new Date(),
      metrics: {
        recoveryVelocityHours: avgRecoveryVelocity ? Number(avgRecoveryVelocity) : "N/A",
        burnoutRiskIndex: Number(avgRisk),
        sentimentStability: 1 - Number(sentimentVariance), // higher is more stable
        sleepQualityScore: profile?.sleepQuality || 3
      },
      insights: {
        stressHeatmap: heatmap,
        commonTriggers,
        stressProneDays: Object.entries(heatmap)
          .filter(([_, count]) => count > 0)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 2)
          .map(([day]) => day)
      },
      patternVersion: 'v1.0.0-fingerprint'
    };
  } catch (err) {
    console.error('Error generating emotional fingerprint:', err.message);
    throw err;
  }
}

module.exports = { generateEmotionalFingerprint };
