import request from 'supertest';
import { app } from '../../src/server.js';
import { pool } from '../../src/infrastructure/database/connection.js';

describe('Integration Tests - Admin Dashboard & Metrics', () => {
    let adminToken;
    let employeeToken;
    let customerToken;
    let employeeId;
    let customerId;
    let productId;

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
        const adminUserRes = await pool.query("SELECT id FROM users WHERE email = 'admin_dash_test@autoshop.com'");
        adminId = adminUserRes.rows[0].id;

        // Cria Employee
        const empReg = await request(app).post('/users/cadastro').send({
            name: 'Employee Dash',
            email: 'employee_dash_test@autoshop.com',
            password: 'password123'
        });
        employeeId = empReg.body.data.id;
        await pool.query("UPDATE users SET role = 'EMPLOYEE' WHERE email = 'employee_dash_test@autoshop.com'");
        const empLogin = await request(app).post('/auth/login').send({
            email: 'employee_dash_test@autoshop.com',
            password: 'password123'
        });
        employeeToken = empLogin.body.token;

        // Cria Customer comum
        const custReg = await request(app).post('/users/cadastro').send({
            name: 'Customer Dash',
            email: 'customer_dash_test@autoshop.com',
            password: 'password123'
        });
        customerId = custReg.body.data.id;
        const custLogin = await request(app).post('/auth/login').send({
            email: 'customer_dash_test@autoshop.com',
            password: 'password123'
        });
        customerToken = custLogin.body.token;

        // Cria Produto base
        const prod = await request(app).post('/products').set('Authorization', `Bearer ${adminToken}`).send({
            name: 'Produto Dashboard Teste',
            cost_price: 50.00,
            sell_price: 100.00,
            current_stock: 2
        });
        productId = prod.body.data.id;
    });

    afterAll(async () => {
        await pool.end();
    });

    it('ADMIN deve conseguir acessar o resumo executivo do dashboard', async () => {
        const res = await request(app)
            .get('/dashboard/summary')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('success');
        expect(res.body.data).toHaveProperty('totalCustomers');
        expect(res.body.data).toHaveProperty('serviceOrdersByStatus');
        expect(res.body.data).toHaveProperty('lowStockCount');
    });

    it('ADMIN deve conseguir acessar métricas financeiras sem filtros', async () => {
        const res = await request(app)
            .get('/dashboard/financial')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('success');
        expect(res.body.data).toHaveProperty('summary');
        expect(res.body.data).toHaveProperty('orders');
    });

    it('ADMIN deve conseguir filtrar métricas financeiras por intervalo de datas, funcionário, cliente e produto', async () => {
        const res = await request(app)
            .get(`/dashboard/financial?start_date=2026-01-01&end_date=2026-12-31&customer_id=${customerId}&employee_id=${employeeId}&product_id=${productId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('success');
        expect(Array.isArray(res.body.data.orders)).toBe(true);
    });

    it('Usuário deslogado NÃO deve conseguir acessar o resumo ou métricas financeiras do dashboard (401)', async () => {
        const resSummary = await request(app).get('/dashboard/summary');
        expect(resSummary.status).toBe(401);

        const resFinancial = await request(app).get('/dashboard/financial');
        expect(resFinancial.status).toBe(401);
    });

    it('Funcionário (EMPLOYEE) NÃO deve conseguir acessar o dashboard (summary ou financial)', async () => {
        const resSummary = await request(app)
            .get('/dashboard/summary')
            .set('Authorization', `Bearer ${employeeToken}`);
        expect(resSummary.status).toBeGreaterThanOrEqual(400);

        const resFinancial = await request(app)
            .get('/dashboard/financial')
            .set('Authorization', `Bearer ${employeeToken}`);
        expect(resFinancial.status).toBeGreaterThanOrEqual(400);
    });

    it('CUSTOMER comum NÃO deve conseguir acessar o dashboard', async () => {
        const res = await request(app)
            .get('/dashboard/summary')
            .set('Authorization', `Bearer ${customerToken}`);

        expect(res.status).toBeGreaterThanOrEqual(400);
    });
});