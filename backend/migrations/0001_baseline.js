/**
 * 0001_baseline.js
 * Baseline migration. The schema-defined indexes are managed by
 * `npm run migrate:indexes` (Model.syncIndexes); this file marks the starting
 * point and is the template for future data/schema migrations.
 *
 * Each migration exports:
 *   - up(mongoose):   apply the change (required, idempotent)
 *   - down(mongoose): revert the change (optional)
 *
 * Example future migration body:
 *   await mongoose.connection.collection('users')
 *     .updateMany({ role: { $exists: false } }, { $set: { role: 'user' } });
 */

async function up(_mongoose) {
  // No-op baseline.
}

async function down(_mongoose) {
  // No-op baseline.
}

module.exports = { up, down };
