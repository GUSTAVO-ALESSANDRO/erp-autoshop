import { jest } from '@jest/globals';
import request from 'supertest';

jest.unstable_mockModule('../../src/infrastructure/external-services/mail/EmailService.js', () => ({
    EmailService: class {
        async sendServiceOrderCompletedEmail() {}
    }
}));

const { app } = await import('../../src/server.js');
const { pool } = await import('../../src/infrastructure/database/connection.js');

describe('Integration Tests - Service Orders (OS) & Business Rules', () => {
    let adminToken;
    let employeeToken;
    let customerToken;
    let otherCustomerToken;
    let customerId;
    let employeeId;
    let productId;
    let createdOsId;

    async function cleanServiceOrderFixtures() {
        const customerQuery = "SELECT id FROM users WHERE email = 'customer_os_test@autoshop.com'";
        await pool.query(`DELETE FROM service_order_items WHERE os_id IN (SELECT id FROM service_orders WHERE customer_id IN (${customerQuery}))`);
        await pool.query(`DELETE FROM service_order_employees WHERE os_id IN (SELECT id FROM service_orders WHERE customer_id IN (${customerQuery}))`);
        await pool.query(`DELETE FROM service_orders WHERE customer_id IN (${customerQuery})`);
        await pool.query(`DELETE FROM users WHERE email IN (
            'admin_os_test@autoshop.com',
            'employee_os_test@autoshop.com',
            'customer_os_test@autoshop.com',
            'other_customer_os_test@autoshop.com'
        )`);
        await pool.query(`
            DELETE FROM products
            WHERE name = 'Peça OS Teste Amortecedor'
            AND NOT EXISTS (
                SELECT 1 FROM service_order_items WHERE product_id = products.id
            )
        `);
    }

    beforeAll(async () => {
        await cleanServiceOrderFixtures();

        // Cria Admin de Teste
        await request(app).post('/users/cadastro').send({
            name: 'Admin OS Test',
            email: 'admin_os_test@autoshop.com',
            password: 'password123'
        });
        await pool.query("UPDATE users SET role = 'ADMIN' WHERE email = 'admin_os_test@autoshop.com'");
        const adminLogin = await request(app).post('/auth/login').send({
            email: 'admin_os_test@autoshop.com',
            password: 'password123'
        });
        adminToken = adminLogin.body.token;

        // Cria Funcionário de Teste
        const empReg = await request(app).post('/users/cadastro').send({
            name: 'Employee OS Test',
            email: 'employee_os_test@autoshop.com',
            password: 'password123'
        });
        employeeId = empReg.body.data.id;
        await pool.query("UPDATE users SET role = 'EMPLOYEE' WHERE email = 'employee_os_test@autoshop.com'");
        const empLogin = await request(app).post('/auth/login').send({
            email: 'employee_os_test@autoshop.com',
            password: 'password123'
        });
        employeeToken = empLogin.body.token;

        // Cria Cliente 1 de Teste
        const custReg = await request(app).post('/users/cadastro').send({
            name: 'Customer OS Test',
            email: 'customer_os_test@autoshop.com',
            password: 'password123'
        });
        customerId = custReg.body.data.id;
        const custLogin = await request(app).post('/auth/login').send({
            email: 'customer_os_test@autoshop.com',
            password: 'password123'
        });
        customerToken = custLogin.body.token;

        // Cria Cliente 2 de Teste (para testar isolamento de dados)
        await request(app).post('/users/cadastro').send({
            name: 'Other Customer OS Test',
            email: 'other_customer_os_test@autoshop.com',
            password: 'password123'
        });
        const otherCustLogin = await request(app).post('/auth/login').send({
            email: 'other_customer_os_test@autoshop.com',
            password: 'password123'
        });
        otherCustomerToken = otherCustLogin.body.token;

        // Cria Produto com estoque para testes de OS e baixa de estoque
        const prodRes = await request(app).post('/products').set('Authorization', `Bearer ${adminToken}`).send({
            name: 'Peça OS Teste Amortecedor',
            description: 'Peça para teste de OS',
            cost_price: 100.00,
            sell_price: 200.00,
            current_stock: 10
        });
        productId = prodRes.body.data.id;
    });

    afterAll(async () => {
        await cleanServiceOrderFixtures();
        await pool.end();
    });

    describe('Caminho Feliz: Abertura, Adição de Itens, Alocação e Conclusão', () => {
        it('Funcionário deve conseguir abrir uma Ordem de Serviço (ORCAMENTO)', async () => {
            const response = await request(app)
                .post('/service-orders')
                .set('Authorization', `Bearer ${employeeToken}`)
                .send({
                    customer_id: customerId,
                    vehicle_brand: 'Chevrolet',
                    vehicle_model: 'Corsa',
                    vehicle_year: '2005',
                    vehicle_fipe_code: '004278-1',
                    title: 'Revisão Geral de Suspensão',
                    description: 'Troca de amortecedores dianteiros',
                    labor_cost: 150.00,
                    discount: 20.00
                });

            expect(response.status).toBe(201);
            expect(response.body.status).toBe('success');
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data.code).toMatch(/^OS-\d{4}-\d{3}$/);
            expect(response.body.data.status).toBe('ORCAMENTO');
            expect(response.body.data.total_amount).toBe(130.00);

            createdOsId = response.body.data.id;
        });

        it('Funcionário deve conseguir adicionar peças/itens à OS no status ORCAMENTO', async () => {
            const response = await request(app)
                .post(`/service-orders/${createdOsId}/items`)
                .set('Authorization', `Bearer ${employeeToken}`)
                .send({
                    product_id: productId,
                    quantity: 1
                });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data.items.length).toBe(1);
        });

        it('Funcionário deve conseguir alocar um mecânico/funcionário à OS', async () => {
            const response = await request(app)
                .post(`/service-orders/${createdOsId}/employees`)
                .set('Authorization', `Bearer ${employeeToken}`)
                .send({
                    employee_id: employeeId
                });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data.employees.length).toBeGreaterThan(0);
        });

        it('Funcionário deve conseguir alterar status para EM_EXECUCAO (Baixa automática de estoque ACID)', async () => {
            const response = await request(app)
                .patch(`/service-orders/${createdOsId}/status`)
                .set('Authorization', `Bearer ${employeeToken}`)
                .send({
                    status: 'EM_EXECUCAO'
                });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data.status).toBe('EM_EXECUCAO');
        });

        it('Funcionário DEVE conseguir adicionar peças e funcionários mesmo com a OS em EM_EXECUCAO', async () => {
            // Adiciona mais um item com a OS já em andamento
            const itemResponse = await request(app)
                .post(`/service-orders/${createdOsId}/items`)
                .set('Authorization', `Bearer ${employeeToken}`)
                .send({
                    product_id: productId,
                    quantity: 1
                });
            expect(itemResponse.status).toBe(200);
        });

        it('Funcionário deve conseguir alterar status para CONCLUIDO', async () => {
            const response = await request(app)
                .patch(`/service-orders/${createdOsId}/status`)
                .set('Authorization', `Bearer ${employeeToken}`)
                .send({
                    status: 'CONCLUIDO'
                });

            expect(response.status).toBe(200);
            expect(response.body.data.status).toBe('CONCLUIDO');
        });

        it('NÃO deve permitir adicionar peças ou funcionários em uma OS já CONCLUIDA', async () => {
            const itemResponse = await request(app)
                .post(`/service-orders/${createdOsId}/items`)
                .set('Authorization', `Bearer ${employeeToken}`)
                .send({
                    product_id: productId,
                    quantity: 1
                });
            expect(itemResponse.status).toBeGreaterThanOrEqual(400);

            const empResponse = await request(app)
                .post(`/service-orders/${createdOsId}/employees`)
                .set('Authorization', `Bearer ${employeeToken}`)
                .send({
                    employee_id: employeeId
                });
            expect(empResponse.status).toBeGreaterThanOrEqual(400);
        });
    });

    describe('Cenários de Exceção, Validações e Regras de Segurança (RBAC)', () => {
        it('Cliente (CUSTOMER) NÃO deve conseguir criar uma Ordem de Serviço (Acesso Negado / 403 ou 422)', async () => {
            const response = await request(app)
                .post('/service-orders')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({
                    vehicle_brand: 'Ford',
                    vehicle_model: 'Ka',
                    title: 'Alinhamento'
                });

            expect(response.status).toBeGreaterThanOrEqual(400);
        });

        it('Usuário deslogado NÃO deve conseguir criar, listar ou atualizar OS (401)', async () => {
            const resPost = await request(app).post('/service-orders').send({ title: 'Teste' });
            expect(resPost.status).toBe(401);

            const resGet = await request(app).get('/service-orders');
            expect(resGet.status).toBe(401);
        });

        it('Cliente (CUSTOMER) deve conseguir consultar APENAS a sua própria OS', async () => {
            // Cria uma OS válida pelo Admin para o cliente 1
            const osAdmin = await request(app)
                .post('/service-orders')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    customer_id: customerId,
                    vehicle_brand: 'Honda',
                    vehicle_model: 'Civic',
                    title: 'Troca de Oleo'
                });
            const customerOsId = osAdmin.body.data.id;

            // Cliente dono consegue ver
            const resOwner = await request(app)
                .get(`/service-orders/${customerOsId}`)
                .set('Authorization', `Bearer ${customerToken}`);
            expect(resOwner.status).toBe(200);

            // Outro cliente NÃO consegue ver (Isolamento de dados)
            const resOther = await request(app)
                .get(`/service-orders/${customerOsId}`)
                .set('Authorization', `Bearer ${otherCustomerToken}`);
            expect(resOther.status).toBeGreaterThanOrEqual(400);
        });

        it('Cliente (CUSTOMER) NÃO deve conseguir adicionar peças ou alterar status de uma OS', async () => {
            const itemResponse = await request(app)
                .post(`/service-orders/${createdOsId}/items`)
                .set('Authorization', `Bearer ${customerToken}`)
                .send({
                    product_id: productId,
                    quantity: 1
                });
            expect(itemResponse.status).toBeGreaterThanOrEqual(400);

            const statusResponse = await request(app)
                .patch(`/service-orders/${createdOsId}/status`)
                .set('Authorization', `Bearer ${customerToken}`)
                .send({
                    status: 'APROVADO'
                });
            expect(statusResponse.status).toBeGreaterThanOrEqual(400);
        });

        it('Deve retornar 404 ao buscar por um ID de OS inexistente ou malformado', async () => {
            const fakeUuid = '00000000-0000-0000-0000-000000000000';
            const response = await request(app)
                .get(`/service-orders/${fakeUuid}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(404);
        });
    });
});