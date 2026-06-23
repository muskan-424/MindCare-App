# MindCare App

React Native mental health platform with an Express/MongoDB API, AI assistant (Tink), therapist booking, mood tracking, and an optional admin dashboard.

## Project structure

| Path | Description |
|------|-------------|
| `src/` | React Native mobile app |
| `backend/` | Express API (deployed on Vercel) |
| `admin/` | Vite admin dashboard (user issues & mood review) |
| `scripts/verify-production.js` | Production smoke checks |

## Prerequisites

- Node.js **22+**
- React Native environment ([setup guide](https://reactnative.dev/docs/set-up-your-environment))
- MongoDB Atlas URI (for backend)
- Android Studio and/or Xcode for device builds

## Quick start — mobile app

```bash
npm ci --legacy-peer-deps
npm start          # Metro bundler
npm run android    # or: npm run ios
```

The app points at the production API by default in `src/utils/route.js`:

```js
export const api_route = 'https://mind-care-app-five.vercel.app';
```

For local backend development, uncomment the LAN IP line in that file and run the API (see below).

## Backend (local)

```bash
cd backend
cp .env.example .env   # set MONGODB_URI, JWT_SECRET, ADMIN_TOKEN
npm install
npm run dev            # http://localhost:5000
npm test               # 76 tests
```

Required production env vars: `MONGODB_URI`, `JWT_SECRET`, `ADMIN_TOKEN` — see `backend/.env.example`.

API docs: `GET /api/docs` · OpenAPI: `GET /api/docs/openapi.json`

## Admin dashboard (local)

```bash
cd admin
cp .env.example .env   # optional; defaults to production API
npm install
npm run dev            # http://localhost:5173
```

Paste the same `ADMIN_TOKEN` value configured on the backend to load users.

## Production verification

From the repo root:

```bash
npm run verify:prod
```

Checks `/api/health` (`configOk: true`), OpenAPI, register, and JWT profile against `api_route`.

## Mobile release (Android)

Production API is configured in `src/utils/route.js` (`https://mind-care-app-five.vercel.app`).

### Test release APK (debug-signed)

```bash
npm run android:release:arm64   # faster — most phones; single architecture
# or
npm run android:release         # all architectures (slower)
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

Install on a device: `adb install android/app/build/outputs/apk/release/app-release.apk`

### Play Store signing

1. Generate a release keystore (keep it safe — you cannot recover a lost keystore):

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore android/app/release.keystore -alias mindcare -keyalg RSA -keysize 2048 -validity 10000
```

2. Copy `android/keystore.properties.example` → `android/keystore.properties` and fill in passwords.

3. Run `npm run android:release` again — the APK will be signed with your release key.

For Google Play, build an AAB: `cd android && gradlew.bat bundleRelease` → `android/app/build/outputs/bundle/release/app-release.aab`

## Deploy

| Component | Host | Notes |
|-----------|------|-------|
| API | Vercel (`backend/`) | Set env vars in Vercel dashboard |
| Admin | [admin-beta-umber-40.vercel.app](https://admin-beta-umber-40.vercel.app) | `VITE_API_URL` set on Vercel; paste `ADMIN_TOKEN` to sign in |
| Mobile | Play Store / App Store | Build release APK/IPA; keep `api_route` on prod |

### Deploy admin to Vercel

1. New Vercel project → import this repo
2. **Root Directory:** `admin`
3. **Environment variable:** `VITE_API_URL` = `https://mind-care-app-five.vercel.app`
4. Deploy — framework preset should detect Vite

## Tests & CI

```bash
npm test                    # frontend (108 tests)
cd backend && npm test      # backend (76 tests)
cd admin && npm run build   # admin production build
```

GitHub Actions runs `frontend-ci`, `backend-ci`, and `admin-ci` on every push to `main`.

## Improvement plan

Phases 1–6 of the backend hardening plan are complete. See `BACKEND_IMPROVEMENT_PLAN.md` for history and optional next steps.

## Troubleshooting

- **App can't reach API** — confirm `api_route` in `src/utils/route.js`; run `npm run verify:prod`
- **Admin 401** — `ADMIN_TOKEN` in the dashboard must match the backend env exactly
- **Backend tests timeout** — first run downloads MongoMemoryServer binary; retry or use Node 22
