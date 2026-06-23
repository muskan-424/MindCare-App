#!/usr/bin/env node
/**
 * One-time backfill: populate primaryEmotions / aiMarkers on fusion results
 * from stored feature vectors. Safe to re-run (idempotent).
 *
 * Usage (from backend/):
 *   node scripts/backfill-fusion-emotions.js
 *   node scripts/backfill-fusion-emotions.js --limit=200
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { config } = require('../config/env');
const { backfillAllFusionEmotions } = require('../src/domains/assessment/services/fusionEmotionBackfillService');

async function main() {
  const limitArg = process.argv.find((a) => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : 500;

  await mongoose.connect(config.mongoUri);
  const result = await backfillAllFusionEmotions({ limit });
  console.log(`Backfill complete: scanned ${result.scanned}, updated ${result.updated}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
