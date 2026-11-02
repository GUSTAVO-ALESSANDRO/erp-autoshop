import request from 'supertest';
import { app } from '../../src/server.js';
import { pool } from '../../src/infrastructure/database/connection.js';

describe('Integration Tests - Admin Dashboard & Metrics', () => {
    let adminToken;
    let employeeToken;
    let customerToken;

    beforeAll(async () => {
        await pool.query("DELETE FROM users WHERE email LIKE '%_dash_test@autoshop.com'");

        // Cria Admin
        await request(app).post('/users/cadastro').send({
            name: 'Admin Dash',
            email: 'admin_dash_test@autoshop.com',
            password: 'password123'
        });
        await pool.query("UPDATE users SET role = 'ADMIN' WHERE email = 'admin_dash_test@autoshop.com'");
        const adminLogin = await request(app).post('/auth/login').send({
            email: 'admin_dash_test@autoshop.com',
            password: 'password123'
        });
        adminToken = adminLogin.body.token;

        // Cria Employee
        await request(app).post('/users/cadastro').send({
            name: 'Employee Dash',
            email: 'employee_dash_test@autoshop.com',
            password: 'password123'
        });
        await pool.query("UPDATE users SET role = 'EMPLOYEE' WHERE email = 'employee_dash_test@autoshop.com'");
        const empLogin = await request(app).post('/auth/login').send({
            email: 'employee_dash_test@autoshop.com',
            password: 'password123'
        });
        employeeToken = empLogin.body.token;

        // Cria Customer comum
        await request(app).post('/users/cadastro').send({
            name: 'Customer Dash',
            email: 'customer_dash_test@autoshop.com',
            password: 'password123'
        });
        const custLogin = await request(app).post('/auth/login').send({
            email: 'customer_dash_test@autoshop.com',
            password: 'password123'
        });
        customerToken = custLogin.body.token;
    });

    afterAll(async () => {
        await pool.end();
    });

    describe('Caminho Feliz - Acesso do Administrador (Summary e Financial)', () => {
        it('ADMIN deve conseguir acessar o resumo executivo (/dashboard/summary)', async () => {
            const res = await request(app)
                .get('/dashboard/summary')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            
            // Valida estrutura de usuários
            expect(res.body.data).toHaveProperty('users');
            expect(res.body.data.users).toHaveProperty('active');
            expect(res.body.data.users).toHaveProperty('inactive');
            expect(res.body.data.users).toHaveProperty('total');
            expect(res.body.data.users.active).toHaveProperty('customers');
            expect(res.body.data.users.active).toHaveProperty('employees');
            expect(res.body.data.users.active).toHaveProperty('admins');

            // Valida estrutura de produtos
            expect(res.body.data).toHaveProperty('products');
            expect(res.body.data.products).toHaveProperty('totalCount');
            expect(res.body.data.products).toHaveProperty('stockDetails');
            expect(Array.isArray(res.body.data.products.stockDetails)).toBe(true);

            // Valida estrutura de ordens de serviço
            expect(res.body.data).toHaveProperty('serviceOrders');
            expect(res.body.data.serviceOrders).toHaveProperty('totalCount');
            expect(res.body.data.serviceOrders).toHaveProperty('byStatus');
            expect(res.body.data.serviceOrders.byStatus).toHaveProperty('ORCAMENTO');
            expect(res.body.data.serviceOrders.byStatus).toHaveProperty('CONCLUIDO');
        });

        it('ADMIN deve conseguir acessar as métricas financeiras (/dashboard/financial)', async () => {
            const res = await request(app)
                .get('/dashboard/financial')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.data).toHaveProperty('grossRevenue');
            expect(res.body.data).toHaveProperty('laborRevenue');
            expect(res.body.data).toHaveProperty('totalStockValue');
        });
    });

    describe('Testes de Segurança, Controle de Acesso e Erros (RBAC)', () => {
        it('Usuário deslogado (sem token) NÃO deve conseguir acessar /dashboard/summary (401)', async () => {
            const res = await request(app).get('/dashboard/summary');
            expect(res.status).toBe(401);
        });

        it('Usuário deslogado (sem token) NÃO deve conseguir acessar /dashboard/financial (401)', async () => {
            const res = await request(app).get('/dashboard/financial');
            expect(res.status).toBe(401);
        });

        it('Funcionário (EMPLOYEE) NÃO deve conseguir acessar /dashboard/summary (Forbidden / >= 400)', async () => {
            const res = await request(app)
                .get('/dashboard/summary')
                .set('Authorization', `Bearer ${employeeToken}`);

            expect(res.status).toBeGreaterThanOrEqual(400);
        });

        it('Funcionário (EMPLOYEE) NÃO deve conseguir acessar /dashboard/financial (Forbidden / >= 400)', async () => {
            const res = await request(app)
                .get('/dashboard/financial')
                .set('Authorization', `Bearer ${employeeToken}`);

            expect(res.status).toBeGreaterThanOrEqual(400);
        });

        it('Cliente (CUSTOMER) NÃO deve conseguir acessar /dashboard/summary (Forbidden / >= 400)', async () => {
            const res = await request(app)
                .get('/dashboard/summary')
                .set('Authorization', `Bearer ${customerToken}`);

            expect(res.status).toBeGreaterThanOrEqual(400);
        });

        it('Cliente (CUSTOMER) NÃO deve conseguir acessar /dashboard/financial (Forbidden / >= 400)', async () => {
            const res = await request(app)
                .get('/dashboard/financial')
                .set('Authorization', `Bearer ${customerToken}`);

            expect(res.status).toBeGreaterThanOrEqual(400);
        });
    });
});