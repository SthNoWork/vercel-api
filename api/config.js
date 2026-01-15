// Read configuration from environment variables.
// For local development create a `.env` file (use `.env.example` as a template).

const env = (typeof process !== 'undefined' && process.env) ? process.env : {};

const CONNECTION_STRING = env.CONNECTION_STRING || '';
const PASSWORD = env.PASSWORD || '';
const USERNAME_OVERRIDE = env.USERNAME_OVERRIDE || '';
const DEFAULT_TABLE_NAME = env.DEFAULT_TABLE_NAME || 'hospital_records';
const SCHEMA_NAME = env.SCHEMA_NAME || 'public';
const SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY || '';
const SUPABASE_URL = env.SUPABASE_URL || (function() {
	try {
		if (!CONNECTION_STRING) return '';
		const url = new URL(CONNECTION_STRING);
		const parts = url.username.split('.');
		const projectRef = parts.length > 1 ? parts[1] : parts[0];
		return `https://${projectRef}.supabase.co`;
	} catch (e) {
		return '';
	}
})();

export { CONNECTION_STRING, PASSWORD, USERNAME_OVERRIDE, DEFAULT_TABLE_NAME, SCHEMA_NAME, SUPABASE_ANON_KEY, SUPABASE_URL };