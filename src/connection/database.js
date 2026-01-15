/**
 * Browser-compatible Database utility class using Supabase REST API
 * Works directly from static HTML/JS - no server required!
 * 
 * Usage:
 *   import Database from './connection/database.js';
 *   const db = new Database();
 *   const rows = await db.selectAll();
 */

import { API_BASE, DEFAULT_TABLE_NAME } from './config.js';

export default class Database {
    
    constructor(tableName = null) {
        this.tableName = tableName || DEFAULT_TABLE_NAME;
        this.baseUrl = API_BASE; // serverless API (e.g., /api/db)
        this.headers = {
            'Content-Type': 'application/json'
        };
    }

    // =========================================================================
    // CRUD OPERATIONS
    // =========================================================================

    /**
     * SELECT * FROM table
     * @returns {Promise<Array>} Array of row objects
     */
    async selectAll() {
        const url = new URL(this.baseUrl, window.location.origin);
        url.searchParams.set('table', this.tableName);
        const response = await fetch(url.toString(), { method: 'GET', headers: this.headers });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch records');
        }
        
        return await response.json();
    }

    /**
     * SELECT * FROM table WHERE column = value
     * @param {Object} filters - Map of column names and their values for WHERE clause
     * @returns {Promise<Array>} Array of matching row objects
     */
    async select(filters = {}) {
        if (!filters || Object.keys(filters).length === 0) {
            return this.selectAll();
        }

        const url = new URL(this.baseUrl, window.location.origin);
        url.searchParams.set('table', this.tableName);
        Object.entries(filters).forEach(([k, v]) => url.searchParams.append(k, String(v)));

        const response = await fetch(url.toString(), { method: 'GET', headers: this.headers });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch records');
        }
        
        return await response.json();
    }

    /**
     * INSERT INTO table
     * @param {Object} data - Object with column-value pairs to insert
     * @returns {Promise<Object>} The inserted row
     */
    async insert(data) {
        const payload = { table: this.tableName, data };
        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to insert record');
        }
        
        const rows = await response.json();
        return rows[0];
    }

    /**
     * UPDATE table SET ... WHERE ...
     * @param {Object} data - Object with column-value pairs to update
     * @param {Object} filters - WHERE conditions
     * @returns {Promise<Object>} Result with updated rows
     */
    async update(data, filters = {}) {
        if (!filters || Object.keys(filters).length === 0) {
            throw new Error('Update requires at least one filter to prevent accidental mass updates');
        }

        const payload = { table: this.tableName, data, filters };
        const response = await fetch(this.baseUrl, {
            method: 'PATCH',
            headers: this.headers,
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update records');
        }
        
        const rows = await response.json();
        return { rows, rowsAffected: rows.length };
    }

    /**
     * DELETE FROM table WHERE ...
     * @param {Object} filters - WHERE conditions (required to prevent accidental deletion)
     * @returns {Promise<Object>} Result with deleted rows
     */
    async delete(filters = {}) {
        if (!filters || Object.keys(filters).length === 0) {
            throw new Error('Delete requires at least one filter to prevent accidental mass deletion');
        }

        const payload = { table: this.tableName, filters };
        const response = await fetch(this.baseUrl, {
            method: 'DELETE',
            headers: this.headers,
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete records');
        }
        
        const rows = await response.json();
        return { rows, rowsAffected: rows.length };
    }

    /**
     * Test the connection by fetching table info
     * @returns {Promise<boolean>} True if connection successful
     */
    async testConnection() {
        try {
            const url = new URL(this.baseUrl, window.location.origin);
            url.searchParams.set('table', this.tableName);
            url.searchParams.set('limit', '1');
            const response = await fetch(url.toString(), { method: 'GET', headers: this.headers });
            return response.ok;
        } catch (err) {
            console.error('Connection test failed:', err);
            return false;
        }
    }
}
