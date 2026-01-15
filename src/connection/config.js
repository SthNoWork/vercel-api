// config.js

// ⚠️ Will throw if environment variables are missing
const CONNECTION_STRING = process.env.CONNECTION_STRING;
const PASSWORD = process.env.PASSWORD;
const USERNAME_OVERRIDE = process.env.USERNAME_OVERRIDE;
const DEFAULT_TABLE_NAME = process.env.DEFAULT_TABLE_NAME;
const SCHEMA_NAME = process.env.SCHEMA_NAME;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Validate required env vars
if (!CONNECTION_STRING) throw new Error("CONNECTION_STRING is missing");
if (!PASSWORD) throw new Error("PASSWORD is missing");
if (!USERNAME_OVERRIDE) throw new Error("USERNAME_OVERRIDE is missing");
if (!DEFAULT_TABLE_NAME) throw new Error("DEFAULT_TABLE_NAME is missing");
if (!SCHEMA_NAME) throw new Error("SCHEMA_NAME is missing");
if (!SUPABASE_ANON_KEY) throw new Error("SUPABASE_ANON_KEY is missing");

// Auto-parse connection string
const url = new URL(CONNECTION_STRING);
const [baseUser, projectRef] = url.username.split('.');

// Build Supabase REST API URL from project ref
const SUPABASE_URL = `https://${projectRef}.supabase.co`;

export { SUPABASE_URL, SUPABASE_ANON_KEY, DEFAULT_TABLE_NAME, SCHEMA_NAME, PASSWORD, USERNAME_OVERRIDE };
