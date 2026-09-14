# Manual Steps Pending

Tasks from recent work that require your credentials/accounts and can't be done by the agent.

## 1. Gmail SMTP for login email verification codes — DONE
Configured and verified working (both locally and against the live Render deploy): `SMTP_USER`/`SMTP_PASS`/`EMAIL_FROM` are set in `backend/.env`, and real login-OTP emails send successfully.

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
`npx jest` in `backend/` passes all tests but the process doesn't exit afterward — it warns "Jest did not exit one second after the test run has completed," implying an unclosed handle (likely a DB connection or socket) somewhere in test teardown. Harmless for now since results are still correct and Jest force-exits, but worth running with `--detectOpenHandles` at some point to track down and fix.

## 6. Low disk space on C: is breaking Docker (root cause found, not yet fixed)
`docker compose up` was failing with "the paging file is too small" — traced this to your C: drive having only ~9.2GB free out of 266GB. Windows can't grow the page file under memory pressure with that little headroom, which is what actually breaks Docker's CLI plugins (compose, buildx, etc.) — it's a disk-space problem, not a Docker or app bug. Also relevant: your `backend/docker-compose.yml` spins up its own MongoDB + Redis containers, but you already have a native MongoDB Windows service running locally, and Redis is fully optional in the app (every usage already checks `client.isOpen` and no-ops gracefully) — so Docker Compose may not even be necessary for day-to-day local dev.

When ready, pick one:
- Quick safe cleanup: reclaim Docker's own unused images/build cache (~2.7GB, fully recoverable via `docker system prune`) plus temp/npm cache junk — enough headroom to unblock Docker.
- Full audit: figure out what's actually eating the other ~250GB on C: before deleting anything.
- Skip Docker for local dev entirely: run the backend directly with `npm start` against the existing native MongoDB service instead of `docker-compose up`.
