// ============================================================================
// Vercel Serverless API - Proxies requests to Supabase REST API
// Reads credentials from environment variables (set in Vercel project settings)
// ============================================================================

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || '';
const SCHEMA_NAME = process.env.SCHEMA_NAME || 'public';
const DEFAULT_TABLE = process.env.DEFAULT_TABLE_NAME || 'hospital_records';

function buildHeaders() {
    const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    };
    if (SCHEMA_NAME && SCHEMA_NAME !== 'public') {
        headers['Accept-Profile'] = SCHEMA_NAME;
        headers['Content-Profile'] = SCHEMA_NAME;
    }
    return headers;
}

function buildFilterQuery(filters = {}) {
    return Object.entries(filters)
        .map(([col, val]) => `${encodeURIComponent(col)}=eq.${encodeURIComponent(String(val))}`)
        .join('&');
}

function cors(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async (req, res) => {
    cors(res);

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (!SUPABASE_URL || !SUPABASE_KEY) {
        return res.status(500).json({ message: 'Server misconfigured: SUPABASE_URL or SUPABASE_KEY missing' });
    }

    try {
        const method = req.method.toUpperCase();

        // ─── GET: Select records ─────────────────────────────────────────────
        if (method === 'GET') {
            const table = req.query.table || DEFAULT_TABLE;
            const base = `${SUPABASE_URL}/rest/v1/${table}`;

            // Build filters from query params starting with 'f_'
            const filters = {};
            Object.keys(req.query || {}).forEach(k => {
                if (k.startsWith('f_')) filters[k.substring(2)] = req.query[k];
            });

            const limit = req.query.limit;
            let url = `${base}?select=*`;
            if (Object.keys(filters).length > 0) url += '&' + buildFilterQuery(filters);
            if (limit) url += `&limit=${encodeURIComponent(limit)}`;

            const r = await fetch(url, { method: 'GET', headers: buildHeaders() });
            const json = await r.json();
            if (!r.ok) return res.status(r.status).json(json);
            return res.status(200).json(json);
        }

        // ─── POST/PATCH/DELETE: Modify records ───────────────────────────────
        const body = req.body || {};
        const table = body.table || DEFAULT_TABLE;
        const base = `${SUPABASE_URL}/rest/v1/${table}`;

        if (method === 'POST') {
            const data = body.data || {};
            const r = await fetch(base, { method: 'POST', headers: buildHeaders(), body: JSON.stringify(data) });
            const json = await r.json();
            if (!r.ok) return res.status(r.status).json(json);
            return res.status(200).json(json);
        }

        if (method === 'PATCH') {
            const data = body.data || {};
            const filters = body.filters || {};
            if (!filters || Object.keys(filters).length === 0) {
                return res.status(400).json({ message: 'PATCH requires filters to prevent mass updates' });
            }
            const url = `${base}?${buildFilterQuery(filters)}`;
            const r = await fetch(url, { method: 'PATCH', headers: buildHeaders(), body: JSON.stringify(data) });
            const json = await r.json();
            if (!r.ok) return res.status(r.status).json(json);
            return res.status(200).json(json);
        }

        if (method === 'DELETE') {
            const filters = body.filters || {};
            if (!filters || Object.keys(filters).length === 0) {
                return res.status(400).json({ message: 'DELETE requires filters to prevent mass deletion' });
            }
            const url = `${base}?${buildFilterQuery(filters)}`;
            const r = await fetch(url, { method: 'DELETE', headers: buildHeaders() });
            const json = await r.json();
            if (!r.ok) return res.status(r.status).json(json);
            return res.status(200).json(json);
        }

        return res.status(405).json({ message: 'Method not allowed' });
    } catch (err) {
        console.error('api/index error:', err);
        return res.status(500).json({ message: err.message || 'Internal server error' });
    }
};
