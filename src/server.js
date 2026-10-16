import express from 'express';
import 'dotenv/config'; // Carrega o .env automaticamente da raiz
import { authRoutes } from './infrastructure/http/routes/authRoutes.js';


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

app.listen(PORT, () => {
  console.log(`Server rodando na porta http://localhost:${PORT}`);
});