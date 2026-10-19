import { Router } from 'express';
import { AuthController } from '../../../adapters/controllers/AuthController.js';
import { LoginUseCase } from '../../../use-cases/auth/LoginUseCase.js';
import { PostgresUserRepository } from '../../repositories/PostgresUserRepository.js';
import { JwtTokenService } from '../../security/JwtTokenService.js';
import { PasswordController } from '../../../adapters/controllers/PasswordController.js';
import { PasswordRecoveryUseCase } from '../../../use-cases/auth/PasswordRecoveryUseCase.js';
import { EmailService } from '../../external-services/mail/EmailService.js';
import { verifyToken } from '../middlewares/verifyToken.js';

const authRoutes = Router();

// Instanciação e injeção manual das dependências das camadas
const userRepository = new PostgresUserRepository();
const tokenService = new JwtTokenService();
const loginUseCase = new LoginUseCase(userRepository, tokenService);
const authController = new AuthController(loginUseCase);
const emailService = new EmailService();

const passwordRecoveryUseCase = new PasswordRecoveryUseCase(userRepository, emailService, tokenService);
const passwordController = new PasswordController(passwordRecoveryUseCase);

// Rotas de Autenticação
authRoutes.post('/login', (req, res) => authController.login(req, res));
authRoutes.post('/logout', verifyToken, (req, res) => {
    // Como JWT é stateless, o logout bem-sucedido instrui o cliente a descartar o token
    return res.status(200).json({ status: 'success', message: 'Logout realizado com sucesso.' });
});

// Rotas de Recuperação de Senha
authRoutes.post('/forgot-password', (req, res) => passwordController.forgotPassword(req, res));
authRoutes.post('/reset-password', (req, res) => passwordController.resetPassword(req, res));

export { authRoutes };