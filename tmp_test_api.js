const KEY = '***REMOVED***';

async function testModel(modelName) {
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${KEY}`;
  const body = {
    contents: [{ role: 'user', parts: [{ text: 'Hi' }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 10 },
  };

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    console.log(`\n=== MODEL: ${modelName} ===`);
    console.log(`Status: ${res.status}`);
    console.log('Result:', data?.error ? data.error.message : data?.candidates?.[0]?.content?.parts?.[0]?.text);
  } catch (err) {
    console.error(`Error with ${modelName}:`, err.message);
  }
}

async function run() {
  await testModel('gemini-2.5-flash');
  await testModel('gemini-flash-latest');
  await testModel('gemini-2.0-flash-lite');
  await testModel('gemini-pro-latest');
}

run();
