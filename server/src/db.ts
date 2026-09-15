import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: new URL('../../.env', import.meta.url) });

const { Pool } = pg;
export const db = new Pool({ connectionString: process.env.DATABASE_URL });
db.on('error', (error) => console.error('PostgreSQL pool error', error));
