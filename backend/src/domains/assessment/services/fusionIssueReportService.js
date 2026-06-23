const IssueReport = require('../../admin/models/IssueReport');

function severityFromRiskLevel(riskLevel) {
  switch (riskLevel) {
    case 'CRITICAL': return 5;
    case 'HIGH': return 4;
    case 'MEDIUM': return 3;
    default: return 2;
  }
}

/**
 * Ensure every completed AI fusion has a matching admin risk report (IssueReport).
 * Idempotent — keyed by sourceFusionId.
 */
async function ensureIssueReportForFusion(fusion) {
  if (!fusion?._id || !fusion.user) return null;

  const existing = await IssueReport.findOne({ sourceFusionId: fusion._id }).lean();
  if (existing) return existing;

  const emotions = fusion.primaryEmotions?.length
    ? fusion.primaryEmotions
    : (fusion.aiMarkers || []);

  const report = await IssueReport.create({
    user: fusion.user,
    category: 'ai_intake_assessment',
    severity: severityFromRiskLevel(fusion.riskLevel),
    description: `AI multidimensional intake assessment (${fusion.modelVersion || 'fusion'})`,
    moodTag: emotions[0] || '',
    sentimentScore: fusion.riskScore != null ? -Number(fusion.riskScore) : null,
    riskLevel: fusion.riskLevel || 'LOW',
    emotionTags: emotions,
    recommendations: fusion.recommendations || [],
    safetyTriggered: fusion.riskLevel === 'CRITICAL',
    sourceFusionId: fusion._id,
    createdAt: fusion.createdAt,
    updatedAt: fusion.updatedAt,
  });

  return report.toObject();
}

async function syncFusionReportsForUser(userId) {
  const AssessmentFusionResult = require('../models/AssessmentFusionResult');
  const fusions = await AssessmentFusionResult.find({ user: userId }).sort({ createdAt: -1 }).lean();
  const results = [];
  for (const fusion of fusions) {
    results.push(await ensureIssueReportForFusion(fusion));
  }
  return results.filter(Boolean);
}

module.exports = { ensureIssueReportForFusion, syncFusionReportsForUser };
