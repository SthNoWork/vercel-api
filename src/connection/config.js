// Client-side config should not contain secrets. Serverless API will hold DB credentials.
// The client will call the serverless endpoint at `/api/db`.

const API_BASE = '/api/db';
const DEFAULT_TABLE_NAME = 'hospital_records';

export { API_BASE, DEFAULT_TABLE_NAME };