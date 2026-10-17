import { pool } from '../database/connection.js';

export class PostgresUserRepository {
    // Busca um usuário no banco de dados filtrando pelo e-mail
    async findByEmail(email) {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        return result.rows[0] || null; // Retorna o usuário encontrado ou null
    }

    // Busca um usuário no banco filtrando pelo ID (menos o hash da senha)
    async findById(id) {
        const result = await pool.query('SELECT id, name, email, role, created_at FROM users WHERE id = $1', [id]);
        return result.rows[0] || null;
    }

    // Insere um novo usuário no banco de dados utilizando is_active (boolean)
    async create({ id, name, email, passwordHash, role, isActive }) {
        const query = `
        INSERT INTO users (id, name, email, password_hash, role, is_active, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING id, name, email, role, is_active, created_at;
        `;
        const values = [id, name, email, passwordHash, role || 'CUSTOMER', isActive ?? true];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    // Retorna a lista de todos os usuários ordenados por data de criação
    async findAll() {
        const result = await pool.query('SELECT id, name, email, role, is_active, created_at FROM users ORDER BY created_at DESC');
        return result.rows;
    }

    // Atualiza os dados de um usuário pelo ID, manipulando is_active
    async update(id, { name, email, role, isActive }) {
        const query = `
        UPDATE users 
        SET name = COALESCE($1, name), 
            email = COALESCE($2, email), 
            role = COALESCE($3, role), 
            is_active = COALESCE($4, is_active)
        WHERE id = $5
        RETURNING id, name, email, role, is_active, created_at;
        `;
        const values = [name, email, role, isActive, id];
        const result = await pool.query(query, values);
        return result.rows[0] || null;
    }

    // Remove um usuário do banco pelo ID
    async delete(id) {
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
        return result.rows[0] || null;
    }
}