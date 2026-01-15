// api/db.js
import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export default async function handler(req, res) {
  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value)
  })

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    // Get config from Vercel environment variables
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY
    const defaultTable = process.env.DEFAULT_TABLE_NAME || 'hospital_records'
    const schemaName = process.env.SCHEMA_NAME || 'public'
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables')
    }
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey, {
      db: { schema: schemaName }
    })

    const tableName = req.query.table || defaultTable
    const method = req.method

    // Parse filters from query params (exclude 'table')
    const filters = { ...req.query }
    delete filters.table

    let query = supabase.from(tableName)

    // ===== SELECT (GET) =====
    if (method === 'GET') {
      query = query.select('*')
      
      // Apply filters if provided
      if (Object.keys(filters).length > 0) {
        Object.entries(filters).forEach(([col, val]) => {
          query = query.eq(col, val)
        })
      }

      const { data, error } = await query
      if (error) throw new Error(error.message || 'Failed to fetch records')
      
      return res.status(200).json(data)
    }

    // ===== INSERT (POST) =====
    if (method === 'POST') {
      const { data, error } = await supabase
        .from(tableName)
        .insert(req.body)
        .select()

      if (error) throw new Error(error.message || 'Failed to insert record')
      
      // Return first row (same as your database.js)
      return res.status(200).json(data[0] || data)
    }

    // ===== UPDATE (PATCH) =====
    if (method === 'PATCH') {
      // Require at least one filter (same safety as your database.js)
      if (Object.keys(filters).length === 0) {
        throw new Error('Update requires at least one filter to prevent accidental mass updates')
      }

      query = query.update(req.body)
      
      Object.entries(filters).forEach(([col, val]) => {
        query = query.eq(col, val)
      })

      const { data, error } = await query.select()
      if (error) throw new Error(error.message || 'Failed to update records')
      
      // Return same format as your database.js
      return res.status(200).json({ 
        rows: data, 
        rowsAffected: data.length 
      })
    }

    // ===== DELETE =====
    if (method === 'DELETE') {
      // Require at least one filter (same safety as your database.js)
      if (Object.keys(filters).length === 0) {
        throw new Error('Delete requires at least one filter to prevent accidental mass deletion')
      }

      query = query.delete()
      
      Object.entries(filters).forEach(([col, val]) => {
        query = query.eq(col, val)
      })

      const { data, error } = await query.select()
      if (error) throw new Error(error.message || 'Failed to delete records')
      
      // Return same format as your database.js
      return res.status(200).json({ 
        rows: data, 
        rowsAffected: data.length 
      })
    }

    return res.status(405).json({ error: 'Method not allowed' })

  } catch (error) {
    console.error('API Error:', error)
    return res.status(400).json({ 
      error: error.message || 'Internal server error' 
    })
  }
}