import { Router } from 'express';
import { AuthController } from '../../../adapters/controllers/AuthController.js';
import { LoginUseCase } from '../../../use-cases/auth/LoginUseCase.js';
import { PostgresUserRepository } from '../../repositories/PostgresUserRepository.js';
import { JwtTokenService } from '../../security/JwtTokenService.js';

const authRoutes = Router();

// Instanciação e injeção manual das dependências das camadas
const userRepository = new PostgresUserRepository();
const tokenService = new JwtTokenService();
const loginUseCase = new LoginUseCase(userRepository, tokenService);
const authController = new AuthController(loginUseCase);

// Define a rota POST para autenticação de usuários
authRoutes.post('/login', (req, res) => authController.login(req, res));

export { authRoutes };