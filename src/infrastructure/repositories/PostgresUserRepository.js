import { pool } from '../database/connection.js';
import { User } from '../../domain/entities/User.js';

export class PostgresUserRepository {
    // Busca um usuário no banco e retorna uma instância da Entidade User
    async findByEmail(email) {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (!result.rows[0]) return null;
        return this.toEntity(result.rows[0]);
    }

    // Busca por ID retornando a Entidade User
    async findById(id) {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        if (!result.rows[0]) return null;
        return this.toEntity(result.rows[0]);
    }

    // Insere aceitando a Entidade User
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
        return this.toEntity(result.rows[0]);
    }

    // Retorna a lista de usuários aceitando filtros opcionais por name, email e role
    async findAll(filters = {}) {
        let query = 'SELECT * FROM users WHERE 1=1';
        const params = [];

        if (filters.name) {
            params.push(`%${filters.name}%`);
            query += ` AND name ILIKE $${params.length}`;
        }
        if (filters.email) {
            params.push(`%${filters.email}%`);
            query += ` AND email ILIKE $${params.length}`;
        }
        if (filters.role) {
            params.push(filters.role);
            query += ` AND role = $${params.length}`;
        }

        query += ' ORDER BY created_at DESC';
        const result = await pool.query(query, params);
        return result.rows.map(row => this.toEntity(row));
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
        return this.toEntity(result.rows[0]);
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
        return this.toEntity(result.rows[0]);
    }

    async findByResetToken(token) {
        const result = await pool.query(
            'SELECT * FROM users WHERE reset_password_token = $1 AND reset_password_expires > NOW()',
            [token]
        );
        if (!result.rows[0]) return null;
        return this.toEntity(result.rows[0]);
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
        return this.toEntity(result.rows[0]);
    }

    // Mapeador auxiliar de linhas do banco para a entidade User
    toEntity(row) {
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