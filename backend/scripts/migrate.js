/**
 * migrate.js — minimal, idempotent migration runner for Mongoose.
 *
 * Looks in backend/migrations for files named like `0001_description.js` that
 * export `async up(mongoose)` (and optionally `async down(mongoose)`), applies
 * any that have not yet run, and records them in the `migrations` collection.
 *
 * Usage:  npm run migrate
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const { config } = require('../config/env');

const Migration = mongoose.model(
  'Migration',
  new mongoose.Schema({
    name: { type: String, unique: true, required: true },
    appliedAt: { type: Date, default: Date.now },
  })
);

async function run() {
  if (!config.mongoUri) {
    console.error('MONGODB_URI is not set — cannot run migrations.');
    process.exit(1);
  }
  await mongoose.connect(config.mongoUri);

  const dir = path.join(__dirname, '..', 'migrations');
  const files = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter(f => /^\d+.*\.js$/.test(f)).sort()
    : [];

  const applied = new Set((await Migration.find().lean()).map(m => m.name));

  let count = 0;
  for (const file of files) {
    if (applied.has(file)) continue;
    const migration = require(path.join(dir, file));
    if (typeof migration.up !== 'function') {
      console.warn(`Skipping ${file}: no up() export`);
      continue;
    }
    console.log(`Applying migration: ${file}`);
    await migration.up(mongoose);
    await Migration.create({ name: file });
    count += 1;
  }

  console.log(count ? `Applied ${count} migration(s).` : 'No pending migrations.');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
