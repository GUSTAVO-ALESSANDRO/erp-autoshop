import { query, pool } from '../../src/infrastructure/database/connection.js';

describe('Database Integration Tests', () => {
  // Fecha a conexão do pool após todos os testes rodarem para o Jest não reclamar de handle aberto
  afterAll(async () => {
    await pool.end();
  });

  test('deve conectar com sucesso ao PostgreSQL', async () => {
    const res = await query('SELECT NOW()');
    expect(res.rows.length).toBeGreaterThan(0);
  });

  test('deve conseguir consultar a estrutura das tabelas criadas nas migrations', async () => {
    const res = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);
    
    const tables = res.rows.map(row => row.table_name);
    
    // Verifica se as principais tabelas do DER existem no banco
    expect(tables).toContain('users');
    expect(tables).toContain('products');
    expect(tables).toContain('service_orders');
  });
});