# DocSphere

Private personal document wallet by **MANIKANDAN S**.

DocSphere is a React + TypeScript app for storing PDFs, JPGs and PNGs in a private Supabase bucket, with account-level access control, optional PIN lock, and a PWA shell. It does **not** claim to be unhackable; it follows ordinary practices: authenticated sessions, row-level security, private storage, short-lived signed URLs, and upload checks.

## Stack

- React 19, TypeScript, Vite
- Tailwind CSS v4
- Supabase Auth, Postgres, Storage

## Setup

1. Copy `.env.example` to `.env` and add your project URL and **anon** key. Never put the service role key in this app.
2. In the Supabase SQL Editor, run `supabase/schema.sql`. That creates `profiles`, `documents`, RLS policies, the PIN verify function, and a **private** `documents` storage bucket.
3. Authentication → URL configuration: add `http://localhost:5173` and your production origin. Include `/reset-password` in redirect allow lists.
4. Install and run:

```bash
npm install
npm run dev
```

## Security model (honest)

- Each document row and storage object is limited to `auth.uid()`.
- Files are not public. View/download uses a **60-second** signed URL, then the file is opened as a blob in memory. The service worker does not cache Supabase or document bytes.
- PIN is optional UI lock: salted SHA-256, 5 failed attempts then 5-minute lockout, auto-lock after 3 minutes idle. A valid session can still call the API, so sign out on shared devices.
- Allowed uploads: PDF / JPEG / PNG, max 10 MB, magic-byte check, UUID storage names.

## PWA / Android later

`public/manifest.json` and `public/sw.js` support installable standalone display. Package with TWA / Capacitor / PWABuilder when you are ready; keep Storage traffic on HTTPS and do not add document caching.
