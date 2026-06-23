#!/usr/bin/env node
/**
 * Production smoke check — health, OpenAPI, register + JWT profile.
 * Usage: npm run verify:prod
 * Override host: API_URL=https://your-host npm run verify:prod
 */
const fs = require('fs');
const path = require('path');

function readApiRoute() {
  if (process.env.API_URL) return process.env.API_URL.replace(/\/$/, '');
  const routeFile = path.join(__dirname, '../src/utils/route.js');
  const source = fs.readFileSync(routeFile, 'utf8');
  const match = source.match(/api_route\s*=\s*['"]([^'"]+)['"]/);
  if (!match) throw new Error('Could not parse api_route from src/utils/route.js');
  return match[1];
}

async function request(method, url, { headers, body } = {}) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json', ...headers } : headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

async function main() {
  const base = readApiRoute();
  const failures = [];

  console.log(`Verifying production API at ${base}\n`);

  const health = await request('GET', `${base}/api/health`);
  console.log('GET /api/health', health.status, health.data);
  if (health.status !== 200 || health.data?.configOk !== true) {
    failures.push('health: expected 200 with configOk=true');
  }

  const openapi = await request('GET', `${base}/api/docs/openapi.json`);
  console.log('GET /api/docs/openapi.json', openapi.status);
  if (openapi.status !== 200) {
    failures.push('openapi: expected 200');
  }

  const email = `verify-${Date.now()}@example.com`;
  const reg = await request('POST', `${base}/api/user`, {
    body: { name: 'Prod Verify', email, password: 'TestPass123!' },
  });
  console.log('POST /api/user', reg.status, reg.data?.token ? 'token received' : reg.data);
  if (!reg.data?.token) {
    failures.push('register: expected token in response');
  } else {
    const profile = await request('GET', `${base}/api/profile/me`, {
      headers: { Authorization: `Bearer ${reg.data.token}` },
    });
    console.log('GET /api/profile/me', profile.status, profile.data?.email || profile.data);
    if (profile.status !== 200 || profile.data?.email !== email) {
      failures.push('profile: expected 200 with matching email');
    }
  }

  if (failures.length) {
    console.error('\nFAILED:', failures.join('; '));
    process.exit(1);
  }
  console.log('\nAll production checks passed.');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
