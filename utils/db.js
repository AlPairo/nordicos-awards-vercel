// utils/db.js - Database connection pool for Vercel serverless functions
import { Pool } from 'pg';

let pool;

export const query = async (text, params) => {
  if (!pool) {
    const connectionString = process.env.SUPABASE_DB_URL;

    // Debug: log if env var is missing
    if (!connectionString) {
      console.error('❌ SUPABASE_DB_URL environment variable is not set!');
      throw new Error('Database connection string not configured');
    }

    console.log('🔗 Connecting to database:', connectionString.replace(/:[^:@]+@/, ':****@'));

    pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: true }
        : { rejectUnauthorized: false }, // Allow self-signed certs in development
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  return pool.query(text, params);
};
