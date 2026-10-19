import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

// Verifica se o SSL foi habilitado via variável de ambiente, quando está em produção
const useSsl = process.env.DB_SSL === 'true';

export const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'autocare_db',
    ssl: useSsl ? { rejectUnauthorized: false } : false
});

export async function query(text, params) {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
}