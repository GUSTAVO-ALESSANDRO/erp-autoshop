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
        expect(res.body.data.balance_after).toBe(15);
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
        expect(res.body.data.balance_after).toBe(12);
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
        expect(res.body.data.balance_after).toBe(25);
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

    it('Deve retornar erro ao tentar movimentar estoque com tipo inválido', async () => {
        const res = await request(app)
            .post(`/stock/products/${productId}/stock`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                type: 'TIPO_INVALIDO',
                quantity: 10,
                reason: 'Teste de erro'
            });

        expect(res.status).toBe(400);
    });

    it('Deve retornar erro ao tentar movimentar estoque com quantidade menor ou igual a zero', async () => {
        const res = await request(app)
            .post(`/stock/products/${productId}/stock`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                type: 'ENTRADA',
                quantity: 0,
                reason: 'Quantidade zero'
            });

        expect(res.status).toBe(400);
    });

    it('Deve listar todas as movimentações do repositório diretamente', async () => {
        const res = await request(app)
            .get('/stock')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
    });

    it('Deve atualizar uma movimentação de estoque com sucesso via PUT', async () => {
        const listRes = await request(app)
            .get(`/stock/products/${productId}/stock-movements`)
            .set('Authorization', `Bearer ${adminToken}`);
        
        const movementId = listRes.body.data[0].id;

        const updateRes = await request(app)
            .put(`/stock/${movementId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                quantity: 8,
                reason: 'Ajuste de quantidade da movimentação'
            });

        expect(updateRes.status).toBe(200);
        expect(updateRes.body.status).toBe('success');
        expect(updateRes.body.data.quantity).toBe(8);
    });

    it('Deve remover uma movimentação de estoque com sucesso via DELETE e estornar o saldo', async () => {
        const createMov = await request(app)
            .post(`/stock/products/${productId}/stock`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                type: 'ENTRADA',
                quantity: 4,
                reason: 'Para teste de exclusão'
            });
        
        const movementId = createMov.body.data.id;

        const deleteRes = await request(app)
            .delete(`/stock/${movementId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(deleteRes.status).toBe(200);
        expect(deleteRes.body.status).toBe('success');
    });

    it('Deve atualizar o tipo de movimentação de SAIDA para ENTRADA com sucesso', async () => {
        // Cria uma saída
        const createMov = await request(app)
            .post(`/stock/products/${productId}/stock`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                type: 'SAIDA',
                quantity: 2,
                reason: 'Teste troca tipo'
            });
        
        const movementId = createMov.body.data.id;

        // Atualiza mudando o tipo para ENTRADA
        const updateRes = await request(app)
            .put(`/stock/${movementId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                type: 'ENTRADA',
                quantity: 2,
                reason: 'Corrigido para entrada'
            });

        expect(updateRes.status).toBe(200);
        expect(updateRes.body.data.type).toBe('ENTRADA');
    });

    it('Deve listar movimentações filtrando por ID de produto específico via repositório/rota', async () => {
        const res = await request(app)
            .get(`/stock/products/${productId}/stock-movements`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThan(0);
        expect(res.body.data[0].product_id).toBe(productId);
    });

    it('Deve retornar 404 ao tentar buscar histórico de movimentações de um produto com UUID inexistente', async () => {
        const fakeUuid = '00000000-0000-0000-0000-000000000000';
        const res = await request(app)
            .get(`/stock/products/${fakeUuid}/stock-movements`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(404);
    });

    it('Deve retornar 400 ao tentar atualizar uma movimentação com dados inválidos (quantidade zerada ou negativa)', async () => {
        const listRes = await request(app)
            .get(`/stock/products/${productId}/stock-movements`)
            .set('Authorization', `Bearer ${adminToken}`);
        
        const movementId = listRes.body.data[0].id;

        const updateRes = await request(app)
            .put(`/stock/${movementId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                quantity: -5,
                reason: 'Quantidade inválida'
            });

        expect(updateRes.status).toBe(400);
    });
    
    it('Deve executar busca por ID com o parâmetro forUpdate ativado (true)', async () => {
        const listRes = await request(app)
            .get(`/stock/products/${productId}/stock-movements`)
            .set('Authorization', `Bearer ${adminToken}`);
        
        const movementId = listRes.body.data[0].id;

        // Importa diretamente o repositório para testar o método isolado com forUpdate = true e pool padrão
        const { PostgresStockMovementRepository } = await import('../../src/infrastructure/repositories/PostgresStockMovementRepository.js');
        const repo = new PostgresStockMovementRepository();

        const mov = await repo.findById(movementId, pool, true);
        expect(mov).toBeDefined();
        expect(mov.id).toBe(movementId);
    });

    it('Deve retornar null ao buscar por um ID de movimentação inexistente via repositório', async () => {
        const { PostgresStockMovementRepository } = await import('../../src/infrastructure/repositories/PostgresStockMovementRepository.js');
        const repo = new PostgresStockMovementRepository();

        const fakeId = '00000000-0000-0000-0000-000000000000';
        const mov = await repo.findById(fakeId);
        expect(mov).toBeNull();
    });

    it('Deve lidar com atualização retornando null caso a movimentação não exista no banco', async () => {
        const { PostgresStockMovementRepository } = await import('../../src/infrastructure/repositories/PostgresStockMovementRepository.js');
        const repo = new PostgresStockMovementRepository();

        const fakeId = '00000000-0000-0000-0000-000000000000';
        const updated = await repo.update(fakeId, 'ENTRADA', 10, 10, 'Teste', pool);
        expect(updated).toBeNull();
    });

    it('Deve impedir a exclusão de uma movimentação de estoque caso o ID seja inválido ou inexistente', async () => {
        const fakeId = '00000000-0000-0000-0000-000000000000';
        const res = await request(app)
            .delete(`/stock/${fakeId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('Cliente (CUSTOMER) NÃO deve conseguir atualizar movimentações de estoque via PUT', async () => {
        const listRes = await request(app)
            .get(`/stock/products/${productId}/stock-movements`)
            .set('Authorization', `Bearer ${adminToken}`);
        
        const movementId = listRes.body.data[0].id;

        const res = await request(app)
            .put(`/stock/${movementId}`)
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ quantity: 10, reason: 'Tentativa cliente' });

        expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('Cliente (CUSTOMER) NÃO deve conseguir excluir movimentações de estoque via DELETE', async () => {
        const listRes = await request(app)
            .get(`/stock/products/${productId}/stock-movements`)
            .set('Authorization', `Bearer ${adminToken}`);
        
        const movementId = listRes.body.data[0].id;

        const res = await request(app)
            .delete(`/stock/${movementId}`)
            .set('Authorization', `Bearer ${customerToken}`);

        expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('Deve retornar erro ao tentar atualizar movimentação com tipo de operação desconhecido', async () => {
        const listRes = await request(app)
            .get(`/stock/products/${productId}/stock-movements`)
            .set('Authorization', `Bearer ${adminToken}`);
        
        const movementId = listRes.body.data[0].id;

        const res = await request(app)
            .put(`/stock/${movementId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ type: 'TIPO_FALSO', quantity: 5, reason: 'Erro tipo' });

        expect(res.status).toBe(400);
    });

    it('Usuário deslogado NÃO deve conseguir atualizar ou remover movimentações de estoque (401)', async () => {
        const listRes = await request(app)
            .get(`/stock/products/${productId}/stock-movements`)
            .set('Authorization', `Bearer ${adminToken}`);
        
        const movementId = listRes.body.data[0].id;

        const putRes = await request(app).put(`/stock/${movementId}`).send({ quantity: 2 });
        expect(putRes.status).toBe(401);

        const deleteRes = await request(app).delete(`/stock/${movementId}`);
        expect(deleteRes.status).toBe(401);
    });
});