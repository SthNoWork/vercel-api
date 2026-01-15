/**
 * Browser-compatible Database utility class using Supabase REST API
 * Works directly from static HTML/JS - no server required!
 * 
 * Usage:
 *   import Database from './connection/database.js';
 *   const db = new Database();
 *   const rows = await db.selectAll();
 */

import { DEFAULT_TABLE_NAME } from './config.js';

// Client-side wrapper that proxies actions to the serverless API at /api/db
// This avoids embedding service credentials in client code when deploying.
export default class Database {
    constructor(tableName = null) {
        this.tableName = tableName || DEFAULT_TABLE_NAME;
        this.apiBase = '/api/db';
    }

    async request(method, opts = {}) {
        const url = new URL(this.apiBase, window.location.origin);
        if (opts.query) {
            Object.entries(opts.query).forEach(([k, v]) => url.searchParams.append(k, v));
        }

        const fetchOpts = { method, headers: {} };
        if (opts.body) {
            fetchOpts.headers['Content-Type'] = 'application/json';
            fetchOpts.body = JSON.stringify(opts.body);
        }

        const res = await fetch(url.toString(), fetchOpts);
        if (!res.ok) {
            const errText = await res.text();
            let msg = errText;
            try { msg = JSON.parse(errText).message || JSON.parse(errText); } catch (e) {}
            throw new Error(msg || `Request failed: ${res.status}`);
        }
        return await res.json();
    }

    async selectAll() {
        return await this.request('GET', { query: { table: this.tableName } });
    }

    async select(filters = {}) {
        if (!filters || Object.keys(filters).length === 0) return this.selectAll();
        // encode filters as query params 'filter_col' for server
        const query = { table: this.tableName };
        Object.entries(filters).forEach(([k, v]) => query[`f_${k}`] = v);
        return await this.request('GET', { query });
    }

    async insert(data) {
        return await this.request('POST', { body: { table: this.tableName, data } });
    }

    async update(data, filters = {}) {
        return await this.request('PATCH', { body: { table: this.tableName, data, filters } });
    }

    async delete(filters = {}) {
        return await this.request('DELETE', { body: { table: this.tableName, filters } });
    }

    async testConnection() {
        try {
            await this.request('GET', { query: { table: this.tableName, limit: '1' } });
            return true;
        } catch (e) {
            console.error('Connection test failed', e);
            return false;
        }
    }
}
