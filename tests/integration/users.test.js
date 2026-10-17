import request from 'supertest';
import { app } from '../../src/server.js';
import { pool } from '../../src/infrastructure/database/connection.js';

describe('Integration Tests - Users CRUD & RBAC', () => {
    let adminToken;
    let customerToken;
    let createdUserId;
    let otherCustomerId;

    // Executado antes de todos os testes para criar usuários e capturar tokens JWT
    beforeAll(async () => {
        // Limpa eventuais resíduos anteriores de testes
        await pool.query("DELETE FROM users WHERE email LIKE 'test_%@autoshop.com'");

        // Cria um usuário normal via rota pública
        await request(app).post('/users').send({
            name: 'Customer Test',
            email: 'test_customer@autoshop.com',
            password: 'password123'
        });

        // Loga como Customer para pegar o token
        const custLogin = await request(app).post('/auth/login').send({
            email: 'test_customer@autoshop.com',
            password: 'password123'
        });
        customerToken = custLogin.body.token;

        // Cria um segundo Customer para testes de restrição de ID
        await request(app).post('/users').send({
            name: 'Other Customer',
            email: 'test_other_customer@autoshop.com',
            password: 'password123'
        });


        // Cria um Admin
        await request(app).post('/users').send({
            name: 'Admin Test',
            email: 'test_admin@autoshop.com',
            password: 'password123'
        });
        await pool.query("UPDATE users SET role = 'ADMIN' WHERE email = 'test_admin@autoshop.com'");
        
        const adminLogin = await request(app).post('/auth/login').send({
            email: 'test_admin@autoshop.com',
            password: 'password123'
        });
        adminToken = adminLogin.body.token;

        // Cria um Employee simulado via regra de privilégio
        await request(app).post('/users').send({
            name: 'Employee Test',
            email: 'test_employee@autoshop.com',
            password: 'password123'
        });
        await pool.query("UPDATE users SET role = 'EMPLOYEE' WHERE email = 'test_employee@autoshop.com'");
        
        const empLogin = await request(app).post('/auth/login').send({
            email: 'test_employee@autoshop.com',
            password: 'password123'
        });
        employeeToken = empLogin.body.token;
    });

    // Limpa todos os dados de teste gerados, deixando o banco exatamente como estava antes
    afterAll(async () => {
        await pool.query("DELETE FROM users WHERE email LIKE 'test_%@autoshop.com'");
        await pool.end();
    });

    // TESTES DE SUCESSO (CRUD)

    it('Deve cadastrar um novo usuário com sucesso (POST /users)', async () => {
        const response = await request(app)
            .post('/users')
            .send({
                name: 'Novo Cliente',
                email: 'test_new_client@autoshop.com',
                password: 'password123'
            });

        expect(response.status).toBe(201);
        expect(response.body.status).toBe('success');
        expect(response.body.data).toHaveProperty('id');
        createdUserId = response.body.data.id;
    });

    it('Deve listar todos os usuários quando autenticado como ADMIN (GET /users)', async () => {
        const response = await request(app)
            .get('/users')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('success');
        expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('Deve buscar um usuário específico por ID com sucesso (GET /users/:id)', async () => {
        const response = await request(app)
            .get(`/users/${createdUserId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.id).toBe(createdUserId);
    });

    it('Deve atualizar os dados do usuário com sucesso (PUT /users/:id)', async () => {
        const response = await request(app)
            .put(`/users/${createdUserId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: 'Cliente Atualizado' });

        expect(response.status).toBe(200);
        expect(response.body.data.name).toBe('Cliente Atualizado');
    });

    it('Deve deletar o usuário com sucesso quando ADMIN (DELETE /users/:id)', async () => {
        // Cria um usuário temporário
        const tempUser = await request(app)
            .post('/users')
            .send({
                name: 'Usuário Temporário',
                email: 'test_temp_delete@autoshop.com',
                password: 'password123'
            });
        
        const tempUserId = tempUser.body.data.id;

        // Executa a exclusão usando o token de ADMIN
        const response = await request(app)
            .delete(`/users/${tempUserId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        // Valida se foi excluído com sucesso
        expect(response.status).toBe(200);
        expect(response.body.message).toContain('excluído com sucesso');
    });

    // TESTES DE ERRO, VALIDAÇÕES E ACESSOS NÃO PERMITIDOS

    it('Deve retornar erro 400 ao tentar criar usuário sem campos obrigatórios', async () => {
        const response = await request(app)
            .post('/users')
            .send({ name: 'Incompleto' }); // Faltou email e senha

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('error');
    });

    it('Deve retornar erro 400 ao tentar cadastrar e-mail duplicado', async () => {
        const response = await request(app)
            .post('/users')
            .send({
                name: 'Duplicado',
                email: 'test_customer@autoshop.com',
                password: 'password123'
            });

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('error');
    });

    it('Deve retornar erro 401 ao tentar listar usuários sem token de autenticação', async () => {
        const response = await request(app).get('/users');

        expect(response.status).toBe(401);
        expect(response.body.status).toBe('error');
    });

    it('Deve retornar erro 403 (Forbidden) ao tentar listar usuários com perfil CUSTOMER', async () => {
        const response = await request(app)
            .get('/users')
            .set('Authorization', `Bearer ${customerToken}`);

        expect(response.status).toBe(403);
        expect(response.body.status).toBe('error');
    });

    it('Deve retornar erro 403 (Forbidden) ao tentar deletar um usuário logado como CUSTOMER', async () => {
        const response = await request(app)
            .delete(`/users/${createdUserId}`)
            .set('Authorization', `Bearer ${customerToken}`);

        expect(response.status).toBe(403); // Cliente comum não tem permissão de delete
        expect(response.body.status).toBe('error');
    });

    it('Deve retornar erro 404 ao buscar um ID de usuário inexistente', async () => {
        const fakeId = '00000000-0000-0000-0000-000000000000';
        const response = await request(app)
            .get(`/users/${fakeId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(404);
        expect(response.body.status).toBe('error');
    });

    it('Deve retornar erro 400 ao tentar atualizar um usuário inexistente', async () => {
        const fakeId = '00000000-0000-0000-0000-000000000000';
        const response = await request(app)
            .put(`/users/${fakeId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: 'Teste' });

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('error');
    });

    it('Deve deletar o usuário com sucesso quando ADMIN (DELETE /users/:id)', async () => {
        const response = await request(app)
            .delete(`/users/${createdUserId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toContain('excluído com sucesso');
    });

    it('Deve retornar erro 404 ao tentar deletar algo que já foi excluído ou inexistente', async () => {
        const fakeId = '00000000-0000-0000-0000-000000000000';
        const response = await request(app)
            .delete(`/users/${fakeId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(404);
        expect(response.body.status).toBe('error');
    });

    it('Deve retornar erro 403 ao tentar buscar o perfil de outro usuário sendo um CUSTOMER', async () => {
        // Cria um segundo usuário comum para servir de "alvo"
        const targetUser = await request(app)
            .post('/users')
            .send({
                name: 'Usuário Alvo',
                email: 'test_target@autoshop.com',
                password: 'password123'
            });
        
        const targetUserId = targetUser.body.data.id;

        // Tenta buscar os dados do usuário alvo usando o token do CUSTOMER anterior
        const response = await request(app)
            .get(`/users/${targetUserId}`)
            .set('Authorization', `Bearer ${customerToken}`);

        // Valida que o acesso foi negado com status 403 Forbidden
        expect(response.status).toBe(403);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toContain('Acesso negado');
    });
});