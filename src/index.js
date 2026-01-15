// ============================================================================
// Database Records Manager - Browser-compatible (GitHub Pages ready!)
// Uses Supabase REST API via the Database utility class
// ============================================================================

import Database from './database.js';

// Initialize database connection
// This will automatically use the config.js settings
const db = new Database();

// ─── DOM Elements ────────────────────────────────────────────────────────────
const recordForm = document.getElementById('recordForm');
const dynamicFields = document.getElementById('dynamicFields');
const addFieldBtn = document.getElementById('addFieldBtn');
const refreshBtn = document.getElementById('refreshBtn');
const statusDiv = document.getElementById('status');
const recordsTable = document.getElementById('recordsTable');

const filterForm = document.getElementById('filterForm');
const filterFields = document.getElementById('filterFields');
const addFilterBtn = document.getElementById('addFilterBtn');
const clearFilterBtn = document.getElementById('clearFilterBtn');
const filteredTable = document.getElementById('filteredTable');

// ─── Initialize ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Check if elements exist before initializing to avoid errors
    if (dynamicFields) addField(); 
    if (filterFields) addFilterField();
    loadRecords();
});

// ─── Dynamic Field Management ────────────────────────────────────────────────
function addField() {
    const fieldRow = document.createElement('div');
    fieldRow.className = 'field-row flex gap-2 mb-2';
    fieldRow.innerHTML = `
        <input type="text" placeholder="Column name" class="col-name border p-1 rounded w-1/3" required>
        <input type="text" placeholder="Value" class="col-value border p-1 rounded w-1/2">
        <button type="button" class="remove-btn bg-red-100 text-red-600 px-2 rounded" onclick="this.parentElement.remove()">✕</button>
    `;
    dynamicFields.appendChild(fieldRow);
}

function addFilterField() {
    const fieldRow = document.createElement('div');
    fieldRow.className = 'field-row flex gap-2 mb-2';
    fieldRow.innerHTML = `
        <input type="text" placeholder="Column name" class="filter-col border p-1 rounded w-1/3" required>
        <input type="text" placeholder="Value" class="filter-val border p-1 rounded w-1/2">
        <button type="button" class="remove-btn bg-red-100 text-red-600 px-2 rounded" onclick="this.parentElement.remove()">✕</button>
    `;
    filterFields.appendChild(fieldRow);
}

if (addFieldBtn) addFieldBtn.addEventListener('click', addField);
if (addFilterBtn) addFilterBtn.addEventListener('click', addFilterField);

// ─── Load All Records ────────────────────────────────────────────────────────
async function loadRecords() {
    if (!recordsTable) return;
    recordsTable.innerHTML = '<div class="p-4 text-gray-500">Loading records from database...</div>';
    try {
        const rows = await db.selectAll();
        renderTable(rows, recordsTable, true); // true = show delete buttons
    } catch (err) {
        recordsTable.innerHTML = `<div class="p-4 text-red-500 font-bold">Error: ${err.message}</div>`;
    }
}

if (refreshBtn) refreshBtn.addEventListener('click', loadRecords);

// ─── Insert Record ───────────────────────────────────────────────────────────
if (recordForm) {
    recordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {};
        const rows = dynamicFields.querySelectorAll('.field-row');
        rows.forEach(row => {
            const col = row.querySelector('.col-name').value.trim();
            const val = row.querySelector('.col-value').value;
            if (col) data[col] = val || null;
        });

        if (Object.keys(data).length === 0) {
            showStatus('Please add at least one field', 'error');
            return;
        }

        try {
            showStatus('Inserting...', 'info');
            await db.insert(data);
            showStatus('Record inserted successfully!', 'success');
            
            // Reset form but keep one empty field
            dynamicFields.innerHTML = '';
            addField();
            loadRecords();
        } catch (err) {
            showStatus(`Insert failed: ${err.message}`, 'error');
        }
    });
}

// ─── Filter Records ──────────────────────────────────────────────────────────
if (filterForm) {
    filterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const filters = {};
        const rows = filterFields.querySelectorAll('.field-row');
        rows.forEach(row => {
            const col = row.querySelector('.filter-col').value.trim();
            const val = row.querySelector('.filter-val').value.trim();
            if (col && val) filters[col] = val;
        });

        if (Object.keys(filters).length === 0) {
            filteredTable.innerHTML = '<div class="p-2 text-orange-600">Please add at least one filter (column + value)</div>';
            return;
        }

        filteredTable.innerHTML = '<div class="p-4 text-gray-500">Filtering...</div>';
        try {
            const rows = await db.select(filters);
            renderTable(rows, filteredTable, false);
        } catch (err) {
            filteredTable.innerHTML = `<div class="p-4 text-red-500">Error: ${err.message}</div>`;
        }
    });
}

if (clearFilterBtn) {
    clearFilterBtn.addEventListener('click', () => {
        filterFields.innerHTML = '';
        addFilterField();
        filteredTable.innerHTML = '';
    });
}

// ─── Delete Record Handler ───────────────────────────────────────────────────
window.deleteRecord = async function(primaryKeyCol, value) {
    if (!confirm(`Are you sure you want to delete the record where ${primaryKeyCol} is ${value}?`)) return;
    
    try {
        const filters = {};
        filters[primaryKeyCol] = value;
        await db.delete(filters);
        showStatus('Record deleted successfully', 'success');
        loadRecords();
    } catch (err) {
        showStatus(`Delete failed: ${err.message}`, 'error');
    }
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function renderTable(rows, container, allowDelete = false) {
    if (!rows || rows.length === 0) {
        container.innerHTML = '<div class="p-4 text-gray-500 border rounded bg-gray-50">No records found in this table.</div>';
        return;
    }

    const cols = Object.keys(rows[0]);
    // Identify a potential ID column for deletion (usually 'id')
    const idCol = cols.find(c => c.toLowerCase() === 'id') || cols[0];

    let html = `
    <div class="overflow-x-auto shadow-sm rounded-lg border border-gray-200">
        <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
                <tr>
                    ${cols.map(c => `<th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${escapeHtml(c)}</th>`).join('')}
                    ${allowDelete ? '<th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>' : ''}
                </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
    `;

    rows.forEach(row => {
        html += '<tr class="hover:bg-gray-50 transition-colors">';
        cols.forEach(c => {
            const v = row[c];
            const displayVal = v === null ? '<span class="text-gray-300 italic">null</span>' : escapeHtml(String(v));
            html += `<td class="px-4 py-2 text-sm text-gray-600 whitespace-nowrap">${displayVal}</td>`;
        });
        
        if (allowDelete) {
            html += `
                <td class="px-4 py-2 text-right">
                    <button onclick="deleteRecord('${idCol}', '${row[idCol]}')" class="text-red-400 hover:text-red-600 text-sm font-medium">
                        Delete
                    </button>
                </td>
            `;
        }
        html += '</tr>';
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
}

function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m]);
}

function showStatus(msg, type) {
    if (!statusDiv) return;
    statusDiv.textContent = msg;
    
    // Styling based on type
    const colors = {
        success: 'bg-green-100 text-green-800 border-green-200',
        error: 'bg-red-100 text-red-800 border-red-200',
        info: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    
    statusDiv.className = `p-3 rounded border mb-4 ${colors[type] || colors.info}`;
    
    // Clear after 4 seconds unless it's an error
    if (type !== 'error') {
        setTimeout(() => { 
            statusDiv.textContent = ''; 
            statusDiv.className = 'hidden'; 
        }, 4000);
    }
}