import { pool } from '../database/connection.js';
import { Product } from '../../domain/entities/Product.js';

export class PostgresProductRepository {
    // Busca por ID retornando a Entidade Product
    async findById(id, dbClient = pool) {
        const result = await dbClient.query('SELECT * FROM products WHERE id = $1', [id]);
        if (!result.rows[0]) return null;
        return new Product({
            id: result.rows[0].id,
            name: result.rows[0].name,
            description: result.rows[0].description,
            cost_price: result.rows[0].cost_price,
            sell_price: result.rows[0].sell_price,
            current_stock: result.rows[0].current_stock,
            is_active: result.rows[0].is_active,
            created_at: result.rows[0].created_at
        });
    }

    // Insere aceitando a Entidade Product e retorna uma nova Entidade
    async create(productEntity, dbClient = pool) {
        const query = `
        INSERT INTO products (id, name, description, cost_price, sell_price, current_stock, is_active, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING *;
        `;
        const values = [
            productEntity.id, 
            productEntity.name, 
            productEntity.description, 
            productEntity.cost_price, 
            productEntity.sell_price, 
            productEntity.current_stock,
            productEntity.is_active,
        ];
        const result = await dbClient.query(query, values);

        // Se houver estoque inicial maior que zero, registra o histórico em stock_movements
        if (productEntity.current_stock > 0) {
            await dbClient.query(
                `INSERT INTO stock_movements (id, product_id, type, quantity, balance_after, reason, created_at)
                 VALUES (gen_random_uuid(), $1, 'ENTRADA', $2, $2, 'Estoque inicial de cadastro', NOW())`,
                [productEntity.id, productEntity.current_stock]
            );
        }

        return new Product({
            id: result.rows[0].id,
            name: result.rows[0].name,
            description: result.rows[0].description,
            cost_price: result.rows[0].cost_price,
            sell_price: result.rows[0].sell_price,
            current_stock: result.rows[0].current_stock,
            is_active: result.rows[0].is_active,
            createdAt: result.rows[0].created_at
        });
    }

    // Retorna a lista completa mapeada para Entidades Products
    async findAll() {
        const result = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
        return result.rows.map(row => new Product({
            id: row.id,
            name: row.name,
            description: row.description,
            cost_price: row.cost_price,
            sell_price: row.sell_price,
            current_stock: row.current_stock,
            is_active: row.is_active,
            created_at: row.created_at
        }));
    }

    // Atualiza e retorna a Entidade Product atualizada
    async update(id, { name, description, cost_price, sell_price, current_stock, is_active }) {
        const query = `
        UPDATE products 
        SET name = COALESCE($1, name), 
            description = $2, 
            cost_price = COALESCE($3, cost_price), 
            sell_price = COALESCE($4, sell_price),
            current_stock = COALESCE($5, current_stock),
            is_active = COALESCE($6, is_active)
        WHERE id = $7
        RETURNING *;
        `;
        const values = [name, description, cost_price, sell_price, current_stock, is_active, id];
        const result = await pool.query(query, values);
        if (!result.rows[0]) return null;
        const row = result.rows[0];
        return new Product({
            id: row.id,
            name: row.name,
            description: row.description,
            cost_price: row.cost_price,
            sell_price: row.sell_price,
            current_stock: row.current_stock,
            is_active: row.is_active,
            created_at: row.created_at
        });
    }
}