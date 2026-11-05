import { pool } from '../database/connection.js';
import { StockMovement } from '../../domain/entities/StockMovement.js';

export class PostgresStockMovementRepository {
    // Insere a movimentação e atualiza o estoque dentro de uma transação ACID
    async createWithTransaction(movementEntity, newStockBalance, dbClient = pool) {
        const updateQuery = `UPDATE products SET current_stock = $1 WHERE id = $2 RETURNING *`;
        await dbClient.query(updateQuery, [newStockBalance, movementEntity.product_id]);

        const query = `
            INSERT INTO stock_movements (id, product_id, type, quantity, balance_after, reason, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            RETURNING *;
        `;
        const values = [
            movementEntity.id,
            movementEntity.product_id,
            movementEntity.type,
            movementEntity.quantity,
            movementEntity.balance_after,
            movementEntity.reason
        ];
        const res = await dbClient.query(query, values);
        return this.toEntity(res.rows[0]);
    }

    // Retorna o histórico de movimentações filtrado por produto
    async findByProductId(productId) {
        const query = `
            SELECT sm.*, p.name as product_name
            FROM stock_movements sm
            JOIN products p ON sm.product_id = p.id
            WHERE sm.product_id = $1
            ORDER BY sm.created_at DESC
        `;
        const res = await pool.query(query, [productId]);
        return res.rows.map(row => this.toEntity(row));
    }

    // Retorna todas as movimentações de estoque do sistema
    async findAll() {
        const query = `
            SELECT sm.*, p.name as product_name
            FROM stock_movements sm
            JOIN products p ON sm.product_id = p.id
            ORDER BY sm.created_at DESC
        `;
        const res = await pool.query(query);
        return res.rows.map(row => this.toEntity(row));
    }

    // Busca movimentação por ID (com suporte a FOR UPDATE para transações)
    async findById(id, dbClient = pool, forUpdate = false) {
        const query = `SELECT sm.*, p.name as product_name FROM stock_movements sm JOIN products p ON sm.product_id = p.id WHERE sm.id = $1`;
        const lockedQuery = forUpdate ? `${query} FOR UPDATE` : query;
        const res = await dbClient.query(lockedQuery, [id]);
        return res.rows[0] ? this.toEntity(res.rows[0]) : null;
    }

    // Atualiza os dados de uma movimentação existente (incluindo o tipo)
    async update(id, type, quantity, balanceAfter, reason, dbClient = pool) {
        const query = `
            UPDATE stock_movements 
            SET type = $1, quantity = $2, balance_after = $3, reason = $4 
            WHERE id = $5 
            RETURNING *;
        `;
        const res = await dbClient.query(query, [type, quantity, balanceAfter, reason, id]);
        return res.rows[0] ? this.toEntity(res.rows[0]) : null;
    }

    // Remove uma movimentação de estoque
    async delete(id, dbClient = pool) {
        await dbClient.query(`DELETE FROM stock_movements WHERE id = $1`, [id]);
    }

    // Mapeia linha do banco para a Entidade StockMovement
    toEntity(row) {
        return new StockMovement({
            id: row.id,
            product_id: row.product_id,
            type: row.type,
            quantity: row.quantity,
            balance_after: row.balance_after,
            reason: row.reason,
            created_at: row.created_at,
            product_name: row.product_name
        });
    }
}