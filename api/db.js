const { Pool } = require('pg');

let pool;

function isValidIdentifier(name) {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
}

function getPool() {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL || (
    process.env.PGHOST && process.env.PGUSER && process.env.PGDATABASE
      ? `postgresql://${encodeURIComponent(process.env.PGUSER)}:${encodeURIComponent(process.env.PGPASSWORD || '')}@${process.env.PGHOST}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE}`
      : null
  );

  if (!connectionString) {
    throw new Error('Database connection not configured. Set DATABASE_URL or PGHOST/PGUSER/PGPASSWORD/PGDATABASE in environment.');
  }

  pool = new Pool({ connectionString });
  return pool;
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async (req, res) => {
  try {
    setCors(res);

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    const pool = getPool();

    if (req.method === 'GET') {
      const { table, limit, ...filters } = req.query || {};
      if (!table || !isValidIdentifier(table)) return res.status(400).json({ error: 'Invalid or missing table parameter' });

      const tableIdent = table;
      const values = [];
      const where = [];
      Object.entries(filters).forEach(([k, v], i) => {
        if (!isValidIdentifier(k)) return;
        where.push(`${k} = $${values.length + 1}`);
        values.push(v);
      });

      let sql = `SELECT * FROM ${tableIdent}`;
      if (where.length) sql += ' WHERE ' + where.join(' AND ');
      if (limit) sql += ' LIMIT ' + parseInt(limit, 10);

      const result = await pool.query(sql, values);
      return res.status(200).json(result.rows);
    }

    if (req.method === 'POST') {
      const { table, data } = req.body || {};
      if (!table || !isValidIdentifier(table)) return res.status(400).json({ error: 'Invalid or missing table' });
      if (!data || typeof data !== 'object') return res.status(400).json({ error: 'Missing data object for insert' });

      const cols = Object.keys(data).filter(isValidIdentifier);
      if (cols.length === 0) return res.status(400).json({ error: 'No valid columns provided' });

      const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
      const values = cols.map(c => data[c]);
      const sql = `INSERT INTO ${table} (${cols.join(',')}) VALUES (${placeholders}) RETURNING *`;

      const result = await pool.query(sql, values);
      return res.status(200).json(result.rows);
    }

    if (req.method === 'PATCH') {
      const { table, data, filters } = req.body || {};
      if (!table || !isValidIdentifier(table)) return res.status(400).json({ error: 'Invalid or missing table' });
      if (!data || typeof data !== 'object') return res.status(400).json({ error: 'Missing data object for update' });
      if (!filters || Object.keys(filters).length === 0) return res.status(400).json({ error: 'Missing filters for update' });

      const setCols = Object.keys(data).filter(isValidIdentifier);
      const whereCols = Object.keys(filters).filter(isValidIdentifier);
      if (setCols.length === 0 || whereCols.length === 0) return res.status(400).json({ error: 'No valid columns in data or filters' });

      const values = [];
      const setParts = setCols.map((c, i) => { values.push(data[c]); return `${c} = $${values.length}`; });
      const whereParts = whereCols.map((c) => { values.push(filters[c]); return `${c} = $${values.length}`; });

      const sql = `UPDATE ${table} SET ${setParts.join(', ')} WHERE ${whereParts.join(' AND ')} RETURNING *`;
      const result = await pool.query(sql, values);
      return res.status(200).json({ rows: result.rows, rowsAffected: result.rowCount });
    }

    if (req.method === 'DELETE') {
      const { table, filters } = req.body || {};
      if (!table || !isValidIdentifier(table)) return res.status(400).json({ error: 'Invalid or missing table' });
      if (!filters || Object.keys(filters).length === 0) return res.status(400).json({ error: 'Missing filters for delete' });

      const whereCols = Object.keys(filters).filter(isValidIdentifier);
      if (whereCols.length === 0) return res.status(400).json({ error: 'No valid filter columns' });

      const values = [];
      const whereParts = whereCols.map((c) => { values.push(filters[c]); return `${c} = $${values.length}`; });

      const sql = `DELETE FROM ${table} WHERE ${whereParts.join(' AND ')} RETURNING *`;
      const result = await pool.query(sql, values);
      return res.status(200).json({ rows: result.rows, rowsAffected: result.rowCount });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    if (!res.headersSent) res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ error: err.message });
  }
};
