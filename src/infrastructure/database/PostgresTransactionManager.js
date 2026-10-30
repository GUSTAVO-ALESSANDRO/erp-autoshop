import { pool } from './connection.js';

export class PostgresTransactionManager {
    // Gerencia o ciclo de vida da transação ACID (BEGIN, COMMIT, ROLLBACK) usando o Pool do PostgreSQL
    async transaction(callback) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}