import request from 'supertest';
import { app } from '../../src/server.js';
import { pool } from '../../src/infrastructure/database/connection.js';

describe('Integration Tests - Products CRUD & Stock', () => {
    let adminToken;
    let customerToken;
    let createdProductId;

    // Antes de todos os testes, limpa testes anteriores e cria tokens reais para testes com autenticação
    beforeAll(async () => {
        // Limpa produtos de testes anteriores
        await pool.query('DELETE FROM products');
        // Limpa usuários de testes anteriores para evitar conflito de e-mail
        await pool.query("DELETE FROM users WHERE email LIKE '%_prod@autocare.com'");

        // Cria de um ADMIN temporário via rota e promoção direta via banco
        await request(app)
            .post('/users/cadastro')
            .send({
                name: 'Admin Teste',
                email: 'admintest_prod@autocare.com',
                password: 'password123'
            });

        // Promove o usuário para ADMIN diretamente no Postgres
        await pool.query("UPDATE users SET role = 'ADMIN' WHERE email = 'admintest_prod@autocare.com'");

        // Faz o login como Admin
        const loginAdmin = await request(app)
            .post('/auth/login')
            .send({
                email: 'admintest_prod@autocare.com',
                password: 'password123'
            });
        adminToken = loginAdmin.body.token;

        // Cria um CUSTOMER comum para testar barreiras de segurança
        await request(app)
            .post('/users/cadastro')
            .send({
                name: 'Customer Comum',
                email: 'customer_prod@autocare.com',
                password: 'password123'
                // role omitido, por padrão será CUSTOMER
            });

        // Faz o login como Customer
        const loginCustomer = await request(app)
            .post('/auth/login')
            .send({
                email: 'customer_prod@autocare.com',
                password: 'password123'
            });
        customerToken = loginCustomer.body.token;
    });

    afterAll(async () => {
        await pool.end();
    });

    // CRUD de Caminho Feliz
    describe('Caminho Feliz e Regras de Negócio', () => {
        it('ADMIN deve conseguir criar um produto com sucesso (com sell_price automático se omitido)', async () => {
            const response = await request(app)
                .post('/products')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Pastilha de Freio',
                    description: 'Pastilha dianteira cerâmica',
                    cost_price: 50.00,
                    // sell_price omitido propositalmente para testar regra de assumir cost_price
                    current_stock: 20
                });

            expect(response.status).toBe(201);
            expect(response.body.status).toBe('success');
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data.name).toBe('Pastilha de Freio');
            expect(response.body.data.sell_price).toBe(50.00); // Garantiu a regra
            
            createdProductId = response.body.data.id;
        });

        it('Deve listar todos os produtos com sucesso (Privado para Admin/Funcionario)', async () => {
            const response = await request(app)
                .get('/products')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
            // Admin deve ver o cost_price
            expect(response.body.data[0]).toHaveProperty('cost_price');
        });

        it('Cliente comum (CUSTOMER) deve conseguir listar produtos de forma pública (sem ver cost_price)', async () => {
            const response = await request(app)
                .get('/products')
                .set('Authorization', `Bearer ${customerToken}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(Array.isArray(response.body.data)).toBe(true);
            // Cliente não pode ver cost_price
            expect(response.body.data[0]).not.toHaveProperty('cost_price');
        });

        it('Deve buscar um produto específico por ID com sucesso', async () => {
            const response = await request(app)
                .get(`/products/${createdProductId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data.id).toBe(createdProductId);
        });

        it('ADMIN deve conseguir atualizar dados do produto com sucesso', async () => {
            const response = await request(app)
                .put(`/products/${createdProductId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Pastilha de Freio Premium',
                    sell_price: 90.00
                });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data.name).toBe('Pastilha de Freio Premium');
            expect(response.body.data.sell_price).toBe(90.00);
        });

        it('ADMIN não deve atualizar estoque pelo CRUD de produtos', async () => {
            const response = await request(app)
                .put(`/products/${createdProductId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ current_stock: 50 });

            expect(response.status).toBe(400);
        });

        it('ADMIN deve conseguir realizar a exclusão lógica (inativação) do produto', async () => {
            const response = await request(app)
                .delete(`/products/${createdProductId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data.is_active).toBe(false);
        });
    });

    // Testes de segurança e permissões
    describe('Segurança e Controle de Acesso (RBAC)', () => {
        it('Usuário com perfil CUSTOMER NÃO deve conseguir criar produto (403 ou Erro de Negócio)', async () => {
            const response = await request(app)
                .post('/products')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({
                    name: 'Óleo de Motor',
                    cost_price: 30.00,
                    current_stock: 10
                });

            expect(response.status).toBeGreaterThanOrEqual(400);
        });

        it('Usuário com perfil CUSTOMER NÃO deve conseguir atualizar produto', async () => {
            const response = await request(app)
                .put(`/products/${createdProductId}`)
                .set('Authorization', `Bearer ${customerToken}`)
                .send({
                    name: 'Tentativa de Hack'
                });

            expect(response.status).toBeGreaterThanOrEqual(400);
        });

        it('Usuário com perfil CUSTOMER NÃO deve conseguir deletar/inativar produto', async () => {
            const response = await request(app)
                .delete(`/products/${createdProductId}`)
                .set('Authorization', `Bearer ${customerToken}`);

            expect(response.status).toBeGreaterThanOrEqual(400);
        });
    });

    // Testes de validação de campos inválidos
    describe('Validações de Campos e Erros de Entrada', () => {
        it('Deve retornar erro ao tentar criar produto sem nome', async () => {
            const response = await request(app)
                .post('/products')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    cost_price: 20.00,
                    current_stock: 5
                });

            expect(response.status).toBe(400);
        });

        it('Deve retornar erro ao tentar criar produto com nome muito curto (menos de 3 caracteres)', async () => {
            const response = await request(app)
                .post('/products')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Oi', // 2 caracteres
                    cost_price: 20.00,
                    current_stock: 5
                });

            expect(response.status).toBe(400);
        });

        it('Deve retornar erro ao tentar criar produto com preço de custo negativo', async () => {
            const response = await request(app)
                .post('/products')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Fluido de Freio',
                    cost_price: -15.00,
                    current_stock: 10
                });

            expect(response.status).toBe(400);
        });

        it('Deve retornar erro ao tentar criar produto com preço de venda negativo', async () => {
            const response = await request(app)
                .post('/products')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Fluido de Freio',
                    cost_price: 15.00,
                    sell_price: -5.00,
                    current_stock: 10
                });

            expect(response.status).toBe(400);
        });

        it('Deve retornar erro ao tentar criar produto com quantidade em estoque negativa', async () => {
            const response = await request(app)
                .post('/products')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Amortecedor',
                    cost_price: 150.00,
                    current_stock: -2
                });

            expect(response.status).toBe(400);
        });

        it('Deve permitir criar produto com preço de custo zerado (0)', async () => {
            const response = await request(app)
                .post('/products')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Brinde Promocional',
                    cost_price: 0,
                    current_stock: 50
                });

            expect(response.status).toBe(201);
            expect(response.body.data.cost_price).toBe(0);
        });

        it('Deve retornar 404 ao buscar por um ID de produto inexistente', async () => {
            const fakeUuid = '00000000-0000-0000-0000-000000000000';
            const response = await request(app)
                .get(`/products/${fakeUuid}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(404);
        });

        it('Deve retornar 400 ao buscar por um ID fora do formato UUID válido', async () => {
            const response = await request(app)
                .get('/products/id-invalido-123')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(400);
        });
    });
});