

const BASE_URL = 'http://localhost:5000';

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
  console.log('--- Starting AI Intake E2E Test ---');

  // 1. Register a test user
  const email = `testuser_${Date.now()}@test.com`;
  console.log(`\n1. Registering user: ${email}...`);
  let res = await fetch(`${BASE_URL}/api/user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Setup User',
      email: email,
      password: 'password123',
    }),
  });
  
  if (!res.ok) {
     const text = await res.text();
     console.error('Registration failed:', res.status, text);
     return;
  }
  
  const authData = await res.json();
  const token = authData.token;
  console.log('-> Registration success! Token acquired.');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 2. Start Session
  console.log('\n2. Starting AI Intake Session (Waking up server if asleep)...');
  let sessionId;
  let attempts = 0;
  
  while (attempts < 3) {
    res = await fetch(`${BASE_URL}/api/aiIntake/session/start`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        triggerType: 'login_quick',
        consent: { cameraConsent: true, micConsent: true, textConsent: true }
      })
    });

    if (res.status === 502 || res.status === 503) {
      attempts++;
      console.log(`-> Received 502/503. Retrying in 4 seconds... (${attempts}/3)`);
      await wait(4000);
    } else {
      break;
    }
  }

  if (!res.ok) {
     console.error('-> Session start failed:', res.status, await res.text());
     return;
  }
  
  const startData = await res.json();
  sessionId = startData.sessionId;
  console.log(`-> Session started! ID: ${sessionId}`);
  console.log('-> Required Modalities:', startData.requiredModalities);

  // 3. Text Response
  console.log('\n3. Submitting Text Response...');
  res = await fetch(`${BASE_URL}/api/aiIntake/session/${sessionId}/text-response`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ responses: [{ text: "I'm feeling very overwhelmed and stressed today." }] })
  });
  console.log('-> Text Status:', res.status);
  console.log('-> Text Data:', await res.json());

  // 4. Voice Response
  console.log('\n4. Submitting Voice Response...');
  res = await fetch(`${BASE_URL}/api/aiIntake/session/${sessionId}/voice-response`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ speechRate: 200, pauseRatio: 0.5, pitchVariance: 0.8, durationSec: 10, snr: 15, voiceRef: 'test.wav' })
  });
  console.log('-> Voice Status:', res.status);
  console.log('-> Voice Data:', await res.json());

  // 5. Vision Response
  console.log('\n5. Submitting Vision Response...');
  res = await fetch(`${BASE_URL}/api/aiIntake/session/${sessionId}/vision-meta`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ blinkRate: 15, AU4: 0.8, AU12: 0.1, headMovement: 0.5, visionRef: 'test.mp4' })
  });
  console.log('-> Vision Status:', res.status);
  console.log('-> Vision Data:', await res.json());

  // 6. Run Fusion
  console.log('\n6. Running Multimodal Fusion...');
  res = await fetch(`${BASE_URL}/api/aiIntake/session/${sessionId}/fusion/run`, {
    method: 'POST',
    headers
  });
  
  if (!res.ok) {
     console.error('-> Fusion failed:', res.status, await res.text());
     return;
  }
  
  const fusionData = await res.json();
  console.log('-> Fusion Status:', res.status);
  console.log('-> Fusion Result:');
  console.dir(fusionData.result, { depth: null, colors: true });

  console.log('\n✅ AI Intake Test Completed Successfully!');
}

runTest().catch(console.error);
