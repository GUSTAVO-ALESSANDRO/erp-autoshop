import { Router } from 'express';
import { UserController } from '../../../adapters/controllers/UserController.js';
import { UserUseCase } from '../../../use-cases/user/UserUseCase.js';
import { PostgresUserRepository } from '../../repositories/PostgresUserRepository.js';
import { JwtTokenService } from '../../security/JwtTokenService.js';
import { verifyToken, optionalVerifyToken } from '../middlewares/verifyToken.js';

const userRoutes = Router();

const userRepository = new PostgresUserRepository();
const tokenService = new JwtTokenService();
const userUseCase = new UserUseCase(userRepository, tokenService);
const userController = new UserController(userUseCase);

userRoutes.post('/cadastro', optionalVerifyToken, (req, res) => userController.create(req, res));
userRoutes.get('/', verifyToken, (req, res) => userController.getAll(req, res));
userRoutes.get('/:id', verifyToken, (req, res) => userController.getById(req, res));
userRoutes.put('/:id', verifyToken, (req, res) => userController.update(req, res));
userRoutes.delete('/:id', verifyToken, (req, res) => userController.delete(req, res));

export { userRoutes };