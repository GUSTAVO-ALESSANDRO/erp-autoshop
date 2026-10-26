import { pool } from '../database/connection.js';
import { User } from '../../domain/entities/User.js';

export class PostgresUserRepository {
    // Busca um usuário no banco e retorna uma instância da Entidade User
    async findByEmail(email) {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (!result.rows[0]) return null;
        return new User({
            id: result.rows[0].id,
            name: result.rows[0].name,
            email: result.rows[0].email,
            passwordHash: result.rows[0].password_hash,
            role: result.rows[0].role,
            isActive: result.rows[0].is_active,
            createdAt: result.rows[0].created_at,
            resetPasswordToken: result.rows[0].reset_password_token,
            resetPasswordExpires: result.rows[0].reset_password_expires
        });
    }

    // Busca por ID retornando a Entidade User
    async findById(id) {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        if (!result.rows[0]) return null;
        return new User({
            id: result.rows[0].id,
            name: result.rows[0].name,
            email: result.rows[0].email,
            passwordHash: result.rows[0].password_hash,
            role: result.rows[0].role,
            isActive: result.rows[0].is_active,
            createdAt: result.rows[0].created_at,
            resetPasswordToken: result.rows[0].reset_password_token,
            resetPasswordExpires: result.rows[0].reset_password_expires
        });
    }

    // Insere aceitando a Entidade User e retorna uma nova Entidade
    async create(userEntity) {
        const query = `
        INSERT INTO users (id, name, email, password_hash, role, is_active, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING *;
        `;
        const values = [
            userEntity.id, 
            userEntity.name, 
            userEntity.email, 
            userEntity.passwordHash, 
            userEntity.role, 
            userEntity.isActive
        ];
        const result = await pool.query(query, values);
        const row = result.rows[0];
        return new User({
            id: row.id,
            name: row.name,
            email: row.email,
            passwordHash: row.password_hash,
            role: row.role,
            isActive: row.is_active,
            createdAt: row.created_at
        });
    }

    // Retorna a lista completa mapeada para Entidades User
    async findAll() {
        const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
        return result.rows.map(row => new User({
            id: row.id,
            name: row.name,
            email: row.email,
            passwordHash: row.password_hash,
            role: row.role,
            isActive: row.is_active,
            createdAt: row.created_at
        }));
    }

    // Atualiza e retorna a Entidade User atualizada
    async update(id, { name, email, role, isActive }) {
        const query = `
        UPDATE users 
        SET name = COALESCE($1, name), 
            email = COALESCE($2, email), 
            role = COALESCE($3, role), 
            is_active = COALESCE($4, is_active)
        WHERE id = $5
        RETURNING *;
        `;
        const values = [name, email, role, isActive, id];
        const result = await pool.query(query, values);
        if (!result.rows[0]) return null;
        const row = result.rows[0];
        return new User({
            id: row.id,
            name: row.name,
            email: row.email,
            passwordHash: row.password_hash,
            role: row.role,
            isActive: row.is_active,
            createdAt: row.created_at
        });
    }

    // Remove um usuário
    async delete(id) {
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
        return result.rows[0] || null;
    }

    async updateResetToken(email, token, expiresAt) {
        const query = `
        UPDATE users 
        SET reset_password_token = $1, reset_password_expires = $2
        WHERE email = $3
        RETURNING *;
        `;
        const result = await pool.query(query, [token, expiresAt, email]);
        if (!result.rows[0]) return null;
        const row = result.rows[0];
        return new User({
            id: row.id,
            name: row.name,
            email: row.email,
            passwordHash: row.password_hash,
            role: row.role,
            isActive: row.is_active,
            createdAt: row.created_at,
            resetPasswordToken: row.reset_password_token,
            resetPasswordExpires: row.reset_password_expires
        });
    }

    async findByResetToken(token) {
        const result = await pool.query(
            'SELECT * FROM users WHERE reset_password_token = $1 AND reset_password_expires > NOW()',
            [token]
        );
        if (!result.rows[0]) return null;
        const row = result.rows[0];
        return new User({
            id: row.id,
            name: row.name,
            email: row.email,
            passwordHash: row.password_hash,
            role: row.role,
            isActive: row.is_active,
            createdAt: row.created_at,
            resetPasswordToken: row.reset_password_token,
            resetPasswordExpires: row.reset_password_expires
        });
    }

    async updatePasswordAndClearToken(userId, newPasswordHash) {
        const query = `
        UPDATE users 
        SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL
        WHERE id = $2
        RETURNING *;
        `;
        const result = await pool.query(query, [newPasswordHash, userId]);
        if (!result.rows[0]) return null;
        const row = result.rows[0];
        return new User({
            id: row.id,
            name: row.name,
            email: row.email,
            passwordHash: row.password_hash,
            role: row.role,
            isActive: row.is_active,
            createdAt: row.created_at,
            resetPasswordToken: row.reset_password_token,
            resetPasswordExpires: row.reset_password_expires
        });
    }
}