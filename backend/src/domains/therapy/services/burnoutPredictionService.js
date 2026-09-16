const axios = require('axios');
const Profile = require('../../identity/models/Profile');
const IssueReport = require('../../admin/models/IssueReport');
const { getBurnoutRecommendations } = require('../../../shared/dynamicFallbacks');
const ML_SERVER = require('../../../shared/mlServerUrl');

/**
 * Service to predict short-term burnout likelihood using the custom Python ML pipeline.
 * Inputs come from the user's wellbeing check-in; the ML server rescales them to the model's
 * training ranges. Users who haven't checked in are skipped: their profile only holds defaults,
 * which would give every such user the same score.
 */
async function evaluateBurnoutRisk(userId) {
  if (process.env.NODE_ENV === 'test') return null;

  try {
    const profile = await Profile.findOne({ userId }).lean();
    if (!profile?.wellbeingCheckInAt) return null;

    const payload = {
      age: parseInt(profile.age) || 20,
      gender: profile.gender === 'Male' ? 'Male' : 'Female',
      anxiety: profile.anxietyLevel,
      depression: profile.depressionLevel,
      general_stress: profile.stressLevel,
      academic_stress: profile.academicStress,
      sleep_quality: profile.sleepQuality,
      behavioral_activity: profile.activityLevel,
      social_interaction: profile.socialInteraction,
    };

    const mlResponse = await axios.post(`${ML_SERVER}/predict/burnout`, payload, { timeout: 8000 }).catch(() => null);
    if (!mlResponse || !mlResponse.data) {
      console.log('Python ML Server unreachable or model not trained.');
      return null;
    }

    const { burnoutRiskScore, riskLevel } = mlResponse.data;
    console.log(`ML Burnout Prediction for User ${userId}: Risk = ${burnoutRiskScore}%`);

    // Trigger an intervention if risk is high (>= 70%), at most once every two days.
    if (burnoutRiskScore >= 70) {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const recentAlert = await IssueReport.findOne({
        user: userId,
        category: 'burnout_alert',
        createdAt: { $gte: twoDaysAgo },
      });

      if (!recentAlert) {
        const report = new IssueReport({
          user: userId,
          category: 'burnout_alert',
          severity: 5,
          description: `Automatic System Alert: the burnout model predicts ${burnoutRiskScore}% burnout risk from the user's latest wellbeing check-in.`,
          sentimentScore: -0.8,
          riskLevel: 'HIGH',
          emotionTags: ['burnout', 'exhaustion'],
          recommendations: getBurnoutRecommendations(profile.language || 'en'),
          safetyTriggered: true,
          adminVerified: false,
        });
        await report.save();
        console.log(`[!] Generated automatic burnout alert for user ${userId}`);
      }
    }
    return { burnoutRiskScore, riskLevel };
  } catch (err) {
    console.warn('Burnout prediction engine failed:', err.message);
    return null;
  }
}

module.exports = { evaluateBurnoutRisk };
