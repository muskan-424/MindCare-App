const AssessmentFusionResult = require('../models/AssessmentFusionResult');
const AssessmentFeatureVector = require('../models/AssessmentFeatureVector');
const { fuseAssessment } = require('./ai/fusionAssessmentService');

function needsEmotionBackfill(fusion) {
  return !(fusion.primaryEmotions?.length || fusion.aiMarkers?.length);
}

/**
 * Derive primaryEmotions / aiMarkers from the session feature vector when missing
 * on older fusion records (saved before those fields were persisted).
 */
async function backfillFusionEmotions(fusion) {
  if (!fusion?._id || !needsEmotionBackfill(fusion)) return fusion;

  const fv = await AssessmentFeatureVector.findOne({ session: fusion.session }).lean();
  if (!fv) return fusion;

  const derived = fuseAssessment(fv);
  const aiMarkers = derived.aiMarkers || [];
  const primaryEmotions = derived.primaryEmotions || [];
  if (!aiMarkers.length && !primaryEmotions.length) return fusion;

  const updated = await AssessmentFusionResult.findByIdAndUpdate(
    fusion._id,
    { $set: { aiMarkers, primaryEmotions } },
    { new: true }
  ).lean();

  return updated || fusion;
}

async function syncFusionEmotionsForUser(userId) {
  const fusions = await AssessmentFusionResult.find({ user: userId }).lean();
  const updated = [];
  for (const fusion of fusions) {
    if (needsEmotionBackfill(fusion)) {
      updated.push(await backfillFusionEmotions(fusion));
    }
  }
  return updated;
}

async function backfillAllFusionEmotions({ limit = 500 } = {}) {
  const fusions = await AssessmentFusionResult.find({
    $and: [
      { $or: [{ primaryEmotions: { $size: 0 } }, { primaryEmotions: { $exists: false } }] },
      { $or: [{ aiMarkers: { $size: 0 } }, { aiMarkers: { $exists: false } }] },
    ],
  })
    .limit(limit)
    .lean();

  let count = 0;
  for (const fusion of fusions) {
    const result = await backfillFusionEmotions(fusion);
    if (result !== fusion && (result.primaryEmotions?.length || result.aiMarkers?.length)) {
      count += 1;
    }
  }
  return { scanned: fusions.length, updated: count };
}

module.exports = {
  needsEmotionBackfill,
  backfillFusionEmotions,
  syncFusionEmotionsForUser,
  backfillAllFusionEmotions,
};
