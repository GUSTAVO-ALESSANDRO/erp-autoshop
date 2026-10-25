import request from 'supertest';
import { app } from '../../src/server.js';
import { pool } from '../../src/infrastructure/database/connection.js';

describe('Integration Tests - AutoShop ERP (Auth, RBAC, Users & Password Recovery)', () => {
    let adminToken;
    let employeeToken;
    let customerToken;
    let otherCustomerToken;
    let adminUserId;
    let employeeUserId;
    let customerUserId;
    let otherCustomerUserId;

    beforeAll(async () => {
        // Limpa resíduos de testes anteriores
        await pool.query("DELETE FROM users WHERE email LIKE 'test_%@autoshop.com'");

        // Cria Admin principal via rota pública e promove no banco
        const adminRes = await request(app).post('/users/cadastro').send({
            name: 'Admin Master',
            email: 'test_admin@autoshop.com',
            password: 'password123'
        });
        adminUserId = adminRes.body.data.id;
        await pool.query("UPDATE users SET role = 'ADMIN' WHERE email = 'test_admin@autoshop.com'");
        
        const adminLogin = await request(app).post('/auth/login').send({
            email: 'test_admin@autoshop.com',
            password: 'password123'
        });
        adminToken = adminLogin.body.token;

        // Cria Employee via rota pública como customer e depois promove no banco
        const empRes = await request(app).post('/users/cadastro').send({
            name: 'Employee Worker',
            email: 'test_employee@autoshop.com',
            password: 'password123'
        });
        employeeUserId = empRes.body.data.id;
        
        // Promove explicitamente para EMPLOYEE no banco antes do login
        await pool.query("UPDATE users SET role = 'EMPLOYEE' WHERE email = 'test_employee@autoshop.com'");

        const empLogin = await request(app).post('/auth/login').send({
            email: 'test_employee@autoshop.com',
            password: 'password123'
        });
        employeeToken = empLogin.body.token;

        // Cria um Customer
        const custRes = await request(app).post('/users/cadastro').send({
            name: 'Customer Client',
            email: 'test_customer@autoshop.com',
            password: 'password123'
        });
        customerUserId = custRes.body.data.id;

        const custLogin = await request(app).post('/auth/login').send({
            email: 'test_customer@autoshop.com',
            password: 'password123'
        });
        customerToken = custLogin.body.token;

        // Cria outro Customer
        const otherCustRes = await request(app).post('/users/cadastro').send({
            name: 'Other Customer',
            email: 'test_other_customer@autoshop.com',
            password: 'password123'
        });
        otherCustomerUserId = otherCustRes.body.data.id;

        const otherCustLogin = await request(app).post('/auth/login').send({
            email: 'test_other_customer@autoshop.com',
            password: 'password123'
        });
        otherCustomerToken = otherCustLogin.body.token;
    });

    afterAll(async () => {
        await pool.query("DELETE FROM users WHERE email LIKE 'test_%@autoshop.com'");
        await pool.end();
    });

    // TESTES DE AUTENTICAÇÃO E LOGOUT

    it('Deve realizar login com sucesso com credenciais válidas', async () => {
        const response = await request(app).post('/auth/login').send({
            email: 'test_customer@autoshop.com',
            password: 'password123'
        });
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
    });

    it('Deve falhar no login com senha incorreta (401)', async () => {
        const response = await request(app).post('/auth/login').send({
            email: 'test_customer@autoshop.com',
            password: 'wrongpassword'
        });
        expect(response.status).toBe(401);
        expect(response.body.status).toBe('error');
    });

    it('Deve falhar no login com e-mail inexistente (401)', async () => {
        const response = await request(app).post('/auth/login').send({
            email: 'naoexiste@autoshop.com',
            password: 'password123'
        });
        expect(response.status).toBe(401);
    });

    it('Deve realizar logout com sucesso quando autenticado', async () => {
        const response = await request(app)
            .post('/auth/logout')
            .set('Authorization', `Bearer ${customerToken}`);
        expect(response.status).toBe(200);
        expect(response.body.message).toContain('Logout');
    });

    // VALIDAÇÃO DE ROLES E CADASTRO

    it('Deve forçar role CUSTOMER se um usuário público tentar injetar uma role inválida/inexistente', async () => {
        const response = await request(app).post('/users/cadastro').send({
            name: 'Hacker wannabe',
            email: 'test_hacker@autoshop.com',
            password: 'password123',
            role: 'ADMIN' // Tentando se alto-promover sem token de admin
        });
        expect(response.status).toBe(201);
        expect(response.body.data.role).toBe('CUSTOMER'); // Bloqueado e forçado para customer

        // Limpeza do hacker
        await pool.query("DELETE FROM users WHERE email = 'test_hacker@autoshop.com'");
    });

    it('Deve retornar erro 400 ao tentar cadastrar com e-mail duplicado', async () => {
        const response = await request(app).post('/users/cadastro').send({
            name: 'Duplicado',
            email: 'test_customer@autoshop.com',
            password: 'password123'
        });
        expect(response.status).toBe(422);
    });

    it('Deve retornar erro 400 se faltarem campos obrigatórios no cadastro', async () => {
        const response = await request(app).post('/users/cadastro').send({
            name: 'Incompleto'
        });
        expect(response.status).toBe(400);
    });

    // CRIAÇÃO COM ADMIN
    it('ADMIN deve conseguir criar um novo ADMIN com sucesso', async () => {
        const response = await request(app)
            .post('/users/cadastro')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'Novo Admin Parceiro',
                email: 'test_new_admin@autoshop.com',
                password: 'password123',
                role: 'ADMIN'
            });

        expect(response.status).toBe(201);
        expect(response.body.status).toBe('success');
        expect(response.body.data.role).toBe('ADMIN');

        // Limpeza do novo admin criado
        await pool.query("DELETE FROM users WHERE email = 'test_new_admin@autoshop.com'");
    });

    it('ADMIN deve conseguir criar um novo EMPLOYEE com sucesso', async () => {
        const response = await request(app)
            .post('/users/cadastro')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'Novo Funcionário',
                email: 'test_new_employee@autoshop.com',
                password: 'password123',
                role: 'EMPLOYEE'
            });

        expect(response.status).toBe(201);
        expect(response.body.status).toBe('success');
        expect(response.body.data.role).toBe('EMPLOYEE');

        // Limpeza do novo employee criado
        await pool.query("DELETE FROM users WHERE email = 'test_new_employee@autoshop.com'");
    });

    it('ADMIN deve conseguir promover um CUSTOMER existente para ADMIN via PUT /users/:id', async () => {
        // Usa o customerUserId que já existe no beforeAll
        const response = await request(app)
            .put(`/users/${customerUserId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ role: 'ADMIN' });

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('success');
        expect(response.body.data.role).toBe('ADMIN');

        // Retorna o usuário para CUSTOMER para não quebrar os próximos testes que dependem dele ser cliente
        await pool.query("UPDATE users SET role = 'CUSTOMER' WHERE id = $1", [customerUserId]);
    });

    // TESTES DE LISTAGEM E GERENCIAMENTO DE ROLES

    it('ADMIN deve conseguir listar todos os usuários do sistema', async () => {
        const response = await request(app)
            .get('/users')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('EMPLOYEE deve conseguir listar apenas os clientes (CUSTOMER)', async () => {
        const response = await request(app)
            .get('/users')
            .set('Authorization', `Bearer ${employeeToken}`);
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('CUSTOMER NÃO deve conseguir listar os usuários do sistema (Acesso Negado mapeado para 422)', async () => {
        const response = await request(app)
            .get('/users')
            .set('Authorization', `Bearer ${customerToken}`);
        expect([403, 422]).toContain(response.status);
    });

    it('Requisição sem token em rota protegida deve retornar 401', async () => {
        const response = await request(app).get('/users');
        expect(response.status).toBe(401);
    });

    // BUSCA POR ID E SEGURANÇA CONTRA ACESSOS INDEVIDOS

    it('ADMIN deve conseguir buscar qualquer usuário por ID', async () => {
        const response = await request(app)
            .get(`/users/${customerUserId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(response.status).toBe(200);
        expect(response.body.data.id).toBe(customerUserId);
    });

    it('CUSTOMER deve conseguir buscar seus próprios dados por ID', async () => {
        const response = await request(app)
            .get(`/users/${customerUserId}`)
            .set('Authorization', `Bearer ${customerToken}`);
        expect(response.status).toBe(200);
        expect(response.body.data.id).toBe(customerUserId);
    });

    it('CUSTOMER NÃO deve conseguir buscar dados de outro cliente', async () => {
        const response = await request(app)
            .get(`/users/${otherCustomerUserId}`)
            .set('Authorization', `Bearer ${customerToken}`);
        expect([403, 422]).toContain(response.status);
    });

    it('EMPLOYEE pode ver dados de um cliente', async () => {
        const response = await request(app)
            .get(`/users/${customerUserId}`)
            .set('Authorization', `Bearer ${employeeToken}`);
        expect(response.status).toBe(200);
    });

    it('EMPLOYEE NÃO pode ver dados de outro funcionário ou admin', async () => {
        const response = await request(app)
            .get(`/users/${adminUserId}`)
            .set('Authorization', `Bearer ${employeeToken}`);
        expect([403, 422]).toContain(response.status);
    });

    it('Deve retornar 404 ao buscar um ID inexistente', async () => {
        const fakeUuid = '00000000-0000-0000-0000-000000000000';
        const response = await request(app)
            .get(`/users/${fakeUuid}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(response.status).toBe(404);
    });

    // ATUALIZAÇÃO E REGRAS DE PERMISSÃO

    it('ADMIN deve conseguir atualizar dados de qualquer usuário', async () => {
        const response = await request(app)
            .put(`/users/${customerUserId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: 'Cliente Alterado por Admin' });
        expect(response.status).toBe(200);
        expect(response.body.data.name).toBe('Cliente Alterado por Admin');
    });

    it('CUSTOMER deve conseguir atualizar seu próprio nome', async () => {
        const response = await request(app)
            .put(`/users/${customerUserId}`)
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ name: 'Meu Nome Atualizado' });
        expect(response.status).toBe(200);
    });

    it('CUSTOMER NÃO deve conseguir alterar dados de outra pessoa', async () => {
        const response = await request(app)
            .put(`/users/${otherCustomerUserId}`)
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ name: 'Invasão de Conta' });
        expect([403, 422]).toContain(response.status);
    });

    it('EMPLOYEE NÃO pode alterar dados de um Admin', async () => {
        const response = await request(app)
            .put(`/users/${adminUserId}`)
            .set('Authorization', `Bearer ${employeeToken}`)
            .send({ name: 'Tentativa Employee' });
        expect([403, 422]).toContain(response.status);
    });

    // EXCLUSÃO E RESTRIÇÕES

    it('CUSTOMER NÃO pode deletar nenhuma conta', async () => {
        const response = await request(app)
            .delete(`/users/${customerUserId}`)
            .set('Authorization', `Bearer ${customerToken}`);
        expect([403, 404, 422]).toContain(response.status);
    });

    it('EMPLOYEE pode excluir um cliente (CUSTOMER)', async () => {
        const tempCust = await request(app).post('/users/cadastro').send({
            name: 'Temp Del',
            email: 'test_temp_del@autoshop.com',
            password: 'password123'
        });
        const tempId = tempCust.body.data.id;

        const response = await request(app)
            .delete(`/users/${tempId}`)
            .set('Authorization', `Bearer ${employeeToken}`);
        expect(response.status).toBe(200);
    });

    it('EMPLOYEE NÃO pode excluir um ADMIN', async () => {
        const response = await request(app)
            .delete(`/users/${adminUserId}`)
            .set('Authorization', `Bearer ${employeeToken}`);
        expect([403, 422]).toContain(response.status);
    });

    it('ADMIN pode excluir qualquer usuário com sucesso', async () => {
        const tempCust = await request(app).post('/users/cadastro').send({
            name: 'Temp Admin Del',
            email: 'test_admin_del@autoshop.com',
            password: 'password123'
        });
        const tempId = tempCust.body.data.id;

        const response = await request(app)
            .delete(`/users/${tempId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(response.status).toBe(200);
    });

    it('Deve retornar 404 ao tentar deletar um ID inexistente', async () => {
        const fakeUuid = '00000000-0000-0000-0000-000000000000';
        const response = await request(app)
            .delete(`/users/${fakeUuid}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(response.status).toBe(404);
    });

    // FLUXO DE RECUPERAÇÃO DE SENHA

    /*

    JA FUNCIONA, TRAVEI PARA NÃO FICAR MANDANDO VÁRIOS EMAILS NOS TESTES,
    VOU DESCOMENTAR NO FIM DO DESENVOLVIMENTO DESSE BACK END

    it('Deve solicitar recuperação de senha com sucesso enviando e-mail', async () => {
        const response = await request(app).post('/auth/forgot-password').send({
            email: 'test_customer@autoshop.com'
        });
        expect(response.status).toBe(200);
        expect(response.body.message).toContain('As instruções de recuperação foram enviadas');
    });

    it('Deve retornar erro 404 ao tentar solicitar recuperação para um e-mail que não existe', async () => {
        const response = await request(app).post('/auth/forgot-password').send({
            email: 'naoexiste_recuperacao@autoshop.com'
        });
        expect(response.status).toBe(404);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toContain('E-mail não cadastrado');
    });

    it('Deve falhar ao tentar resetar senha com token inválido ou expirado', async () => {
        const response = await request(app).post('/auth/reset-password').send({
            token: 'token_invalido_123456',
            newPassword: 'novasenha123'
        });
        expect(response.status).toBe(400);
        expect(response.body.status).toBe('error');
    });*/
});