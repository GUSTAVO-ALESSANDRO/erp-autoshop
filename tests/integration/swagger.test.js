import request from 'supertest';
import { app } from '../../src/server.js';

describe('Documentação da API Swagger', () => {
    it('fornece a especificação OpenAPI com as rotas da aplicação documentadas', async () => {
        const response = await request(app).get('/api-docs.json');

        expect(response.status).toBe(200);
        expect(response.body.openapi).toBe('3.0.3');
        expect(response.body.paths).toHaveProperty('/auth/login');
        expect(response.body.paths).toHaveProperty('/products/{id}');
        expect(response.body.paths).toHaveProperty('/service-orders/{id}/items');
        expect(response.body.paths).toHaveProperty('/stock/products/{id}/stock');
        expect(response.body.components.securitySchemes.BearerAuth.scheme).toBe('bearer');
        const documentedOperations = Object.values(response.body.paths)
            .reduce((count, path) => count + Object.keys(path).length, 0);
        expect(documentedOperations).toBe(39);
    });

    it('fornece a interface interativa do Swagger UI', async () => {
        const response = await request(app).get('/api-docs/');

        expect(response.status).toBe(200);
        expect(response.text).toContain('swagger-ui');
    });
});
