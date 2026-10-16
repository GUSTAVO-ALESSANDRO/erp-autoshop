import express from 'express';
import 'dotenv/config'; // Carrega o .env automaticamente da raiz
import { authRoutes } from './infrastructure/http/routes/authRoutes.js';
import { query } from  './infrastructure/database/connection.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use('/auth', authRoutes);

// Rota de origem
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
    console.error('Erro detalhado de conexão:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Falha ao conectar com o banco de dados',
      errorCode: error.code || 'UNKNOWN',
      errorDetails: error.message || String(error)
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server rodando na porta http://localhost:${PORT}`);
});