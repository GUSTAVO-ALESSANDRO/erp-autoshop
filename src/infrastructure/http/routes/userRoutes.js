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

userRoutes.post('/cadastro', optionalVerifyToken, (req, res, next) => userController.create(req, res, next));
userRoutes.get('/', verifyToken, (req, res, next) => userController.getAll(req, res, next));
userRoutes.get('/:id', verifyToken, (req, res, next) => userController.getById(req, res, next));
userRoutes.put('/:id', verifyToken, (req, res, next) => userController.update(req, res, next));
userRoutes.delete('/:id', verifyToken, (req, res, next) => userController.delete(req, res, next));

export { userRoutes };