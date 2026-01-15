// ─── Edge Function Config (Frontend) ─────────────────────────────────────────
const CONNECTION_STRING = 'postgresql://postgres.xvlilgsawbqpedmrbdkv:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres';

// Auto-extract project reference
const url = new URL(CONNECTION_STRING);
const [baseUser, projectRef] = url.username.split('.');

// Environment detection
const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// YOUR VERCEL PROJECT URL
const VERCEL_URL = 'https://your-project.vercel.app'; // ← Change this after deploying

// Edge Function URL (local vs Vercel production)
const EDGE_FUNCTION_URL = isDev 
  ? 'http://localhost:3000/api/my-api'  // Local Vercel dev
  : `${VERCEL_URL}/api/my-api`;          // Production Vercel

// Default table name
const DEFAULT_TABLE_NAME = 'hospital_records';

// Schema name
const SCHEMA_NAME = 'public';

export { EDGE_FUNCTION_URL, DEFAULT_TABLE_NAME, SCHEMA_NAME };