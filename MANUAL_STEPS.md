# Manual Steps Pending

Tasks from recent work that require your credentials/accounts and can't be done by the agent.

## 1. Gmail SMTP for login email verification codes
Login now requires an emailed OTP (`backend/src/domains/identity/routes/auth.js`), but no real email is sent until SMTP is configured — codes currently just print to the backend console.

- Go to Google Account → Security → 2-Step Verification → App passwords → generate one for "Mail".
- Fill in `backend/.env`:
  - `SMTP_USER=<your gmail address>`
  - `SMTP_PASS=<the 16-character app password>`
  - `EMAIL_FROM=<your gmail address>` (optional, defaults to `SMTP_USER`)
- Restart the backend server.

## 2. Deploy the Python ML server (real assessment models)
Assessment scoring (text/voice/vision/mood-trend/burnout) currently runs on simplified Node.js fallback heuristics because the real trained models (`ml/server.py`) aren't deployed anywhere. Config is ready in `render.yaml` (`mindcare-ml` service, alongside the existing `mindcare-api` service).

- Push these changes, then in Render: connect the repo as a Blueprint (or create the `mindcare-ml` web service manually per the comments in `render.yaml`).
- Once `mindcare-ml` is deployed, copy its public URL.
- Set `ML_SERVER_URL=<that URL>` on the `mindcare-api` service in Render's dashboard.
- Redeploy `mindcare-api` so it picks up the new env var.

## 3. Visual QA on a real device/emulator
Not yet verified live (no emulator was available in-session):
- Onboarding screen slides render correctly and don't clip on smaller screens.
- Floating language switcher (top-right, shown on every post-login screen) doesn't overlap content on Home/Fitness/Story/Therapist tabs.
- Facial assessment screen: confirm the camera-not-ready error message shows correctly instead of the old fake-photo fallback, on a real device where the camera briefly isn't ready.

## 4. Admin account
Already done, no action needed — noted for reference: `muskanmittal151@gmail.com` is set as `ADMIN_EMAIL_1` with the password you provided. If you ever forget it, use "Forgot Password" in the app or re-run `npm run reset-admin <email> <newPassword>` in `backend/`.

## 5. Backend test suite doesn't exit cleanly (low priority)
`npx jest` in `backend/` passes all tests (verified: 39/39 in `tests/api.test.js`) but the process doesn't exit afterward — it warns "Jest did not exit one second after the test run has completed," implying an unclosed handle (likely a DB connection or socket) somewhere in test teardown. Harmless for now since results are still correct and Jest force-exits, but worth running with `--detectOpenHandles` at some point to track down and fix, especially if it ever causes CI flakiness/timeouts.
