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
}