const axios = require('axios');
const Profile = require('../models/Profile');
const IssueReport = require('../models/IssueReport');

/**
 * Service to predict short-term burnout likelihood using the custom Python ML pipeline.
 */
async function evaluateBurnoutRisk(userId) {
  try {
    // 1. Gather Demographic Data
    const profile = await Profile.findOne({ user: userId }).lean();
    
    // Map profile defaults to Dataset constraints for Burnout V2 Model (EPAT)
    const payload = {
      age: parseInt(profile?.age) || 20,
      gender: profile?.gender === 'Male' ? 'Male' : 'Female',
      academic_stress: profile?.academicStress || 3,
      anxiety: profile?.anxietyLevel || 2,
      depression: profile?.depressionLevel || 2,
      general_stress: profile?.stressLevel || 3,
      sleep_quality: profile?.sleepQuality || 2.0,
      behavioral_activity: profile?.activityLevel || 2.0,
      social_interaction: profile?.socialInteraction || 2.0
    };

    // 2. Query Python ML Server
    const mlResponse = await axios.post('http://127.0.0.1:8000/predict/burnout', payload, { timeout: 5000 }).catch(err => null);
    
    if (!mlResponse || !mlResponse.data) {
        console.log('Python ML Server unreachable or model not trained.');
        return;
    }

    const { burnoutRiskScore } = mlResponse.data;
    console.log(`Proprietary ML Burnout Prediction for User ${userId}: Risk = ${burnoutRiskScore}%`);

    // 3. Trigger Interventions if risk is critical (> 70%)
    if (burnoutRiskScore >= 70) {
      // Prevent spamming
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const recentAlert = await IssueReport.findOne({ 
        user: userId, 
        category: 'burnout_alert',
        createdAt: { $gte: twoDaysAgo }
      });

      if (!recentAlert) {
        const report = new IssueReport({
          user: userId,
          category: 'burnout_alert',
          severity: 5,
          description: `Automatic System Alert: The internal Machine Learning model predicts a ${burnoutRiskScore}% demographic risk of burnout.`,
          sentimentScore: -0.8,
          riskLevel: 'HIGH',
          emotionTags: ['burnout', 'exhaustion'],
          recommendations: ['Take rest immediately.', 'Speak to a professional.'],
          safetyTriggered: true,
          adminVerified: false
        });
        await report.save();
        console.log(`[!] Generated automatic Proprietary Burnout Alert for user ${userId}`);
      }
    }
  } catch (err) {
    console.warn('Burnout prediction engine failed:', err.message);
  }
}

module.exports = { evaluateBurnoutRisk };
