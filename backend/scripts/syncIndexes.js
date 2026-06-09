/**
 * syncIndexes.js — make Mongoose index definitions authoritative.
 *
 * Loads every model under src/domains/**\/models and calls syncIndexes(),
 * which creates missing indexes and drops indexes no longer declared in the
 * schema. Run after deploys (autoIndex is typically disabled in production).
 *
 * Usage:  npm run migrate:indexes
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const { config } = require('../config/env');

function loadAllModels() {
  const root = path.join(__dirname, '..', 'src', 'domains');
  if (!fs.existsSync(root)) return;
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.isFile() && p.includes(`${path.sep}models${path.sep}`) && p.endsWith('.js')) {
        require(p);
      }
    }
  };
  walk(root);
}

async function run() {
  if (!config.mongoUri) {
    console.error('MONGODB_URI is not set — cannot sync indexes.');
    process.exit(1);
  }
  await mongoose.connect(config.mongoUri);
  loadAllModels();

  const names = Object.keys(mongoose.models);
  for (const name of names) {
    await mongoose.models[name].syncIndexes();
    console.log(`Synced indexes: ${name}`);
  }
  console.log(`Done — ${names.length} model(s).`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error('Index sync failed:', err);
  process.exit(1);
});
