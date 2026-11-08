import express from 'express';
import swaggerUi from 'swagger-ui-express';
import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import { authRoutes } from './infrastructure/http/routes/authRoutes.js';
import { query } from './infrastructure/database/connection.js';
import { userRoutes } from './infrastructure/http/routes/userRoutes.js';
import { notFoundHandler, errorHandler } from './infrastructure/http/middlewares/errorHandler.js';
import { productRoutes } from './infrastructure/http/routes/productRoutes.js';
import { fipeRoutes } from './infrastructure/http/routes/fipeRoutes.js';
import { serviceOrderRoutes } from './infrastructure/http/routes/serviceOrderRoutes.js';
import { stockRoutes } from './infrastructure/http/routes/stockRoutes.js';
import { dashboardRoutes } from './infrastructure/http/routes/dashboardRoutes.js';
import { openApiDocument } from './infrastructure/http/openApiDocument.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Desativa o cabeçalho X-Powered-By para mitigar rastreamento de tecnologia
app.disable('x-powered-by');

app.use(express.json());

app.get('/api-docs.json', (_req, res) => res.json(openApiDocument));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

// Rotas de diagnostico do sistema
app.get('/', (req, res) => {
    return res.status(200).json({
        status: 'ok',
        message: 'Servidor ERP AutoCare rodando com sucesso!',
        timestamp: new Date().toISOString()
    });
});

app.get('/db', async (req, res) => {
    try {
      const start = Date.now();
      const result = await query('SELECT NOW() AS current_time');
      const duration = Date.now() - start;

      return res.status(200).json({
        status: 'success',
        message: 'Conexão com o banco de dados estabelecida com sucesso!',
        database: {
            timestamp: result.rows[0].current_time,
            responseTimeMs: duration
        }
      });
    } catch (error) {
        console.error('Erro de conexão com o banco de dados:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Falha na conexão com o banco de dados.'
        });
    }
});

// Rotas do sistema
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/products', productRoutes);
app.use('/fipe', fipeRoutes);
app.use('/service-orders', serviceOrderRoutes);
app.use('/stock', stockRoutes);
app.use('/dashboard', dashboardRoutes);

// Middlewares Gglobais de erro
app.use(notFoundHandler);
app.use(errorHandler);

const isDirectExecution = process.argv[1]
    && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
    app.listen(PORT, () => {
        console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
}

export { app };