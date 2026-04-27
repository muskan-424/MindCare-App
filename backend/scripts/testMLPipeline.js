#!/usr/bin/env node
/**
 * MindCare ML Pipeline Integration Test
 * Tests all three Python ML endpoints to confirm the server is running
 * and returning valid responses.
 *
 * Usage: node scripts/testMLPipeline.js
 * Pre-requisite: Python ML server must be running on port 8000
 *   -> cd ml && pip install -r requirements.txt
 *   -> python train.py
 *   -> python server.py
 */

const axios = require('axios');

const ML_BASE = 'http://127.0.0.1:8000';

const PASS = '\x1b[32m[PASS]\x1b[0m';
const FAIL = '\x1b[31m[FAIL]\x1b[0m';
const INFO = '\x1b[36m[INFO]\x1b[0m';

let passed = 0;
let failed = 0;

function assert(condition, testName, detail = '') {
  if (condition) {
    console.log(`${PASS} ${testName}`);
    passed++;
  } else {
    console.log(`${FAIL} ${testName}${detail ? ' → ' + detail : ''}`);
    failed++;
  }
}

async function run() {
  console.log('\n======================================================');
  console.log(' 🧠  MindCare Python ML Pipeline — Integration Test  ');
  console.log('======================================================\n');

  // -------------------------------------------------------------------------
  // TEST 1: Health Check
  // -------------------------------------------------------------------------
  console.log(`${INFO} Test 1: /health`);
  try {
    const res = await axios.get(`${ML_BASE}/health`, { timeout: 5000 });
    assert(res.status === 200, 'Health endpoint returns 200');
    assert(res.data.status === 'ok', 'Health status is "ok"');
    assert(typeof res.data.models_loaded === 'object', 'models_loaded object exists');
    if (!res.data.models_loaded?.burnout) {
      console.log(`  \x1b[33m⚠️  Model not loaded (burnout_model.pkl missing — run train.py first)\x1b[0m`);
    } else {
      console.log(`  ✅ Burnout model is loaded.`);
    }
  } catch (e) {
    console.log(`${FAIL} Could not reach Python ML server at ${ML_BASE}`);
    console.log(`       Make sure you run: cd ml && python server.py`);
    console.log(`\n  Aborting remaining tests.\n`);
    process.exit(1);
  }

  // -------------------------------------------------------------------------
  // TEST 2: Burnout Prediction — Normal student (expect LOW)
  // -------------------------------------------------------------------------
  console.log(`\n${INFO} Test 2: /predict/burnout (Normal profile → expect LOW)`);
  try {
    const res = await axios.post(`${ML_BASE}/predict/burnout`, {
      age: 21, gender: 'Female', academic_stress: 5, anxiety: 5, depression: 5,
      general_stress: 5, sleep_quality: 9.0, behavioral_activity: 85.0, social_interaction: 15.0
    });
    assert(res.status === 200, 'Burnout endpoint returns 200');
    assert(typeof res.data.burnoutRiskScore === 'number', 'burnoutRiskScore is a number');
    assert(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(res.data.riskLevel), 'Valid riskLevel returned');
    console.log(`  📊 Risk Score: ${res.data.burnoutRiskScore}% | Level: ${res.data.riskLevel} | Model: ${res.data.modelVersion}`);
  } catch (e) {
    console.log(`${FAIL} /predict/burnout error: ${e.response?.data?.detail || e.message}`);
    failed++;
  }

  // -------------------------------------------------------------------------
  // TEST 3: Burnout Prediction — High-risk profile (expect HIGH or CRITICAL)
  // -------------------------------------------------------------------------
  console.log(`\n${INFO} Test 3: /predict/burnout (High-risk profile → expect HIGH/CRITICAL)`);
  try {
    const res = await axios.post(`${ML_BASE}/predict/burnout`, {
      age: 24, gender: 'Male', academic_stress: 40, anxiety: 40, depression: 40,
      general_stress: 40, sleep_quality: 2.0, behavioral_activity: 10.0, social_interaction: 2.0
    });
    assert(res.status === 200, 'Burnout endpoint returns 200 for high-risk profile');
    console.log(`  📊 Risk Score: ${res.data.burnoutRiskScore}% | Level: ${res.data.riskLevel}`);
  } catch (e) {
    console.log(`${FAIL} /predict/burnout high-risk error: ${e.response?.data?.detail || e.message}`);
    failed++;
  }

  // -------------------------------------------------------------------------
  // TEST 4: Voice Analysis — Calm speaker (expect LOW)
  // -------------------------------------------------------------------------
  console.log(`\n${INFO} Test 4: /analyze/voice (Calm speaker → expect LOW)`);
  try {
    const res = await axios.post(`${ML_BASE}/analyze/voice`, {
      speechRate: 135, pauseRatio: 0.1, pitchVariance: 0.3,
      durationSec: 8, snr: 25, energyLevel: 0.7
    });
    assert(res.status === 200, 'Voice endpoint returns 200');
  } catch (e) {
    console.log(`${FAIL} /analyze/voice error: ${e.response?.data?.detail || e.message}`);
    failed++;
  }

  // -------------------------------------------------------------------------
  // TEST 5: Voice Analysis — Distressed speaker (slow, flat, long pauses)
  // -------------------------------------------------------------------------
  console.log(`\n${INFO} Test 5: /analyze/voice (Distressed speaker → expect MEDIUM/HIGH)`);
  try {
    const res = await axios.post(`${ML_BASE}/analyze/voice`, {
      speechRate: 62, pauseRatio: 0.55, pitchVariance: 0.05,
      durationSec: 10, snr: 8, energyLevel: 0.2
    });
    assert(res.status === 200, 'Voice endpoint returns 200 for distressed profile');
  } catch (e) {
    console.log(`${FAIL} /analyze/voice distressed error: ${e.response?.data?.detail || e.message}`);
    failed++;
  }

  // -------------------------------------------------------------------------
  // TEST 6: Vision Analysis — Relaxed face (expect LOW)
  // -------------------------------------------------------------------------
  console.log(`\n${INFO} Test 6: /analyze/vision (Relaxed face → expect LOW)`);
  try {
    const res = await axios.post(`${ML_BASE}/analyze/vision`, {
      emotion: 'Happy', confidence: 0.95, faceDetectedRatio: 0.95
    });
    assert(res.status === 200, 'Vision endpoint returns 200');
    console.log(`  👁️  Risk Score: ${res.data.riskScore} | Level: ${res.data.riskLevel}`);
  } catch (e) {
    console.log(`${FAIL} /analyze/vision error: ${e.response?.data?.detail || e.message}`);
    failed++;
  }

  // -------------------------------------------------------------------------
  // TEST 7: Vision Analysis — High anxiety face
  // -------------------------------------------------------------------------
  console.log(`\n${INFO} Test 7: /analyze/vision (High stress face → expect MEDIUM/HIGH)`);
  try {
    const res = await axios.post(`${ML_BASE}/analyze/vision`, {
      emotion: 'Fear', confidence: 0.9, faceDetectedRatio: 0.9
    });
    assert(res.status === 200, 'Vision endpoint returns 200 for anxious profile');
    console.log(`  👁️  Risk Score: ${res.data.riskScore} | Level: ${res.data.riskLevel}`);
  } catch (e) {
    console.log(`${FAIL} /analyze/vision anxiety error: ${e.response?.data?.detail || e.message}`);
    failed++;
  }

  // -------------------------------------------------------------------------
  // TEST 8: Text Sentiment — Reddit Model (expect HIGH)
  // -------------------------------------------------------------------------
  console.log(`\n${INFO} Test 8: /analyze/text-local (Expect CRITICAL)`);
  try {
    const res = await axios.post(`${ML_BASE}/analyze/text-local`, {
      statement: "I can't take this anymore, I want to end it all. The pressure is too much for me."
    });
    assert(res.status === 200, 'Text sentiment returns 200');
    console.log(`  📝 Risk Score: ${res.data.riskScore} | Level: ${res.data.riskLevel}`);
  } catch (e) {
    console.log(`${FAIL} /analyze/text-local error: ${e.response?.data?.detail || e.message}`);
    failed++;
  }

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  const total = passed + failed;
  console.log('\n======================================================');
  console.log(` Results: ${passed}/${total} tests passed`);
  if (failed === 0) {
    console.log(' ✅ All ML endpoints are operational!');
  } else {
    console.log(` ⚠️  ${failed} test(s) failed. Check the output above.`);
  }
  console.log('======================================================\n');

  process.exit(failed === 0 ? 0 : 1);
}

run();
