import { pool } from '../database/connection.js';
import { Product } from '../../domain/entities/Product.js';

export class PostgresProductRepository {
    // Busca por ID retornando a Entidade Product
    async findById(id) {
        const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
        if (!result.rows[0]) return null;
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

    // Insere aceitando a Entidade Product e retorna uma nova Entidade
    async create(productEntity) {
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
        const result = await pool.query(query, values);
        const row = result.rows[0];
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
            createdAt: row.created_at
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
            createdAt: row.created_at
        });
    }
}