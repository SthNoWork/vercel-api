# Vercel Deployment Guide

This project is a static HTML/JS app that uses a small serverless proxy to access Supabase/Postgres securely.

Quick steps to deploy on Vercel:

1. Create a new Vercel project and connect this repository.
2. In Project Settings → Environment Variables, set:
   - `SUPABASE_URL` (e.g. `https://<project>.supabase.co`)
   - `SUPABASE_SERVICE_KEY` (preferred) or `SUPABASE_ANON_KEY`
   - Optional: `SCHEMA_NAME` if not `public`
3. Deploy. The client will call `/api/db` for database operations.

Local testing:

Install the Vercel CLI and run:

```bash
npm i -g vercel
vercel dev
```

Ensure the same env vars are available locally (use `.env` or `vercel env pull`).

Notes:
- Do NOT commit secrets in `config.js` or other files. The serverless function reads secrets from `process.env`.
- If you prefer to call Supabase directly from the browser, you can set `SUPABASE_ANON_KEY` in client code, but be aware of permissions.
