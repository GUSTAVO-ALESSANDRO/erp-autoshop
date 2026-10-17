import { Router } from 'express';
import { UserController } from '../../../adapters/controllers/UserController.js';
import { UserUseCase } from '../../../use-cases/user/UserUseCase.js';
import { PostgresUserRepository } from '../../repositories/PostgresUserRepository.js';
import { JwtTokenService } from '../../security/JwtTokenService.js';
import { verifyToken } from '../middlewares/verifyToken.js';
import { checkRole } from '../middlewares/checkRole.js';

const userRoutes = Router();

// Injeção de dependências
const userRepository = new PostgresUserRepository();
const tokenService = new JwtTokenService();
const userUseCase = new UserUseCase(userRepository, tokenService);
const userController = new UserController(userUseCase);

// Rota pública para cadastro de novos clientes (CUSTOMER)
userRoutes.post('/', (req, res) => userController.create(req, res));

// Rotas protegidas (Exigem autenticação por Token JWT)
userRoutes.get('/', verifyToken, checkRole(['ADMIN', 'EMPLOYEE']), (req, res) => userController.getAll(req, res));
userRoutes.get('/:id', verifyToken, (req, res) => userController.getById(req, res));
userRoutes.put('/:id', verifyToken, checkRole(['ADMIN', 'EMPLOYEE']), (req, res) => userController.update(req, res));
userRoutes.delete('/:id', verifyToken, checkRole(['ADMIN']), (req, res) => userController.delete(req, res));

export { userRoutes };