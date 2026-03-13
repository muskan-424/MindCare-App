# Run MindCare app as Admin (inside the app)

The MindCare **mobile app** can show an Admin dashboard instead of the normal Home/Story/Therapist/Fitness tabs when you log in with an account that the backend treats as admin.

---

## 1. Set admin email on the backend

The backend treats a user as admin if their **email** is in the allowed list.

**Local backend** – in `backend/.env` add (use your real email):

```env
ADMIN_EMAIL_1=your-admin@example.com
# optional second admin:
# ADMIN_EMAIL_2=another@example.com
```

**Render** – in the service **Environment** add:

- `ADMIN_EMAIL_1` = your admin email (e.g. `your-admin@example.com`)
- Optionally `ADMIN_EMAIL_2` for another admin

Restart the backend (or let Render redeploy) after changing env.

---

## 2. Set admin token for API calls (optional but needed for data)

The in-app Admin screen calls `/api/admin/*`. Those routes require the `ADMIN_TOKEN` header.

- In **backend** `.env` (or Render env) set:
  ```env
  ADMIN_TOKEN=your-secret-admin-token
  ```
- In the app, **AdminDashboardScreen** uses a hardcoded token. Either:
  - Set the **same** value in the backend and in code, or
  - Change `src/screens/AdminDashboardScreen.js`: set `ADMIN_TOKEN` to the same string you put in `ADMIN_EMAIL_1` / backend `ADMIN_TOKEN`.

If you don’t set this, the app will show the Admin UI but “Load users” may fail with Unauthorized.

---

## 3. Have an account with that email

- **Sign up** in the app with the email you set in `ADMIN_EMAIL_1`, or  
- Use an **existing** account whose email is in `ADMIN_EMAIL_1` / `ADMIN_EMAIL_2`.

---

## 4. Run the app and log in

From the project root:

```bash
npm start
```

In another terminal:

```bash
npx react-native run-android
```

(or `run-ios` on Mac). Then:

1. Open the MindCare app on the device/emulator.
2. **Log in** with the admin email (and password).
3. After login, the app will show the **Admin dashboard** (user list, assessments, mood history) instead of the normal bottom tabs.

---

## Summary

| Step | What to do |
|------|------------|
| 1 | Set `ADMIN_EMAIL_1` (and optionally `ADMIN_EMAIL_2`) on the backend to the admin email(s). |
| 2 | Set `ADMIN_TOKEN` on the backend and use the same value in `AdminDashboardScreen.js` (or update the screen to use it). |
| 3 | Use an account with that email (sign up or existing). |
| 4 | Run app → log in with that email → you see the in-app Admin dashboard. |

No separate “admin app” is needed; the same MindCare app shows admin when `auth.user.role === 'admin'` (set by the backend from the admin email list).
