import request from 'supertest';
import { app } from '../../src/server.js';
import { pool } from '../../src/infrastructure/database/connection.js';

describe('Integration Tests - Stock Movements, Initial Stock & Audit', () => {
    let adminToken;
    let customerToken;
    let productId;

    beforeAll(async () => {
        await pool.query("DELETE FROM users WHERE email LIKE '%_stock_test@autoshop.com'");
        
        // Cria Admin
        await request(app).post('/users/cadastro').send({
            name: 'Admin Stock',
            email: 'admin_stock_test@autoshop.com',
            password: 'password123'
        });
        await pool.query("UPDATE users SET role = 'ADMIN' WHERE email = 'admin_stock_test@autoshop.com'");
        const adminLogin = await request(app).post('/auth/login').send({
            email: 'admin_stock_test@autoshop.com',
            password: 'password123'
        });
        adminToken = adminLogin.body.token;

        // Cria Customer
        await request(app).post('/users/cadastro').send({
            name: 'Customer Stock',
            email: 'customer_stock_test@autoshop.com',
            password: 'password123'
        });
        const custLogin = await request(app).post('/auth/login').send({
            email: 'customer_stock_test@autoshop.com',
            password: 'password123'
        });
        customerToken = custLogin.body.token;

        // Cria Produto base com estoque inicial (deve gerar stock_movement de entrada)
        const prod = await request(app).post('/products').set('Authorization', `Bearer ${adminToken}`).send({
            name: 'Produto Estoque Teste',
            cost_price: 10.00,
            sell_price: 20.00,
            current_stock: 5
        });
        productId = prod.body.data.id;
    });

    afterAll(async () => {
        await pool.end();
    });

    it('Criar produto com estoque inicial deve ter gerado registro automático em stock_movements', async () => {
        const res = await request(app)
            .get(`/stock/products/${productId}/stock-movements`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);
        expect(res.body.data[0].type).toBe('ENTRADA');
        expect(res.body.data[0].quantity).toBe(5);
    });

    it('Deve realizar ENTRADA de estoque com sucesso e atualizar o saldo', async () => {
        const res = await request(app)
            .post(`/stock/products/${productId}/stock`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                type: 'ENTRADA',
                quantity: 10,
                reason: 'Compra de lote adicional'
            });

        expect(res.status).toBe(201);
        expect(res.body.status).toBe('success');
        expect(res.body.data.balance_after).toBe(15); // 5 inicial + 10 entrada
    });

    it('Deve realizar SAIDA de estoque com sucesso', async () => {
        const res = await request(app)
            .post(`/stock/products/${productId}/stock`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                type: 'SAIDA',
                quantity: 3,
                reason: 'Uso em balcão'
            });

        expect(res.status).toBe(201);
        expect(res.body.data.balance_after).toBe(12); // 15 - 3
    });

    it('Deve realizar AJUSTE de estoque com sucesso', async () => {
        const res = await request(app)
            .post(`/stock/products/${productId}/stock`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                type: 'AJUSTE',
                quantity: 25,
                reason: 'Inventário físico anual'
            });

        expect(res.status).toBe(201);
        expect(res.body.data.balance_after).toBe(25); // Ajustado para 25
    });

    it('Deve impedir SAIDA que resulte em estoque negativo', async () => {
        const res = await request(app)
            .post(`/stock/products/${productId}/stock`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                type: 'SAIDA',
                quantity: 1000,
                reason: 'Saída excessiva'
            });

        expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('Deve listar histórico geral de movimentações', async () => {
        const res = await request(app)
            .get('/stock')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('Usuário deslogado NÃO deve conseguir movimentar ou ver estoque (401)', async () => {
        const resGet = await request(app).get('/stock');
        expect(resGet.status).toBe(401);

        const resPost = await request(app).post(`/stock/products/${productId}/stock`).send({ type: 'ENTRADA', quantity: 5 });
        expect(resPost.status).toBe(401);
    });

    it('Cliente (CUSTOMER) NÃO deve conseguir movimentar o estoque', async () => {
        const res = await request(app)
            .post(`/stock/products/${productId}/stock`)
            .set('Authorization', `Bearer ${customerToken}`)
            .send({
                type: 'ENTRADA',
                quantity: 5
            });

        expect(res.status).toBeGreaterThanOrEqual(400);
    });
});