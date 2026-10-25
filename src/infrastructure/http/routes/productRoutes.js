import { Router } from 'express';
import { ProductController } from '../../../adapters/controllers/ProductController.js';
import { ProductUseCase } from '../../../use-cases/product/ProductUseCase.js';
import { PostgresProductRepository } from '../../repositories/PostgresProductRepository.js';
import { verifyToken, optionalVerifyToken } from '../middlewares/verifyToken.js';
import { checkRole } from '../middlewares/checkRole.js';

const productRoutes = Router();

const productRepository = new PostgresProductRepository();
const productUseCase = new ProductUseCase(productRepository);
const productController = new ProductController(productUseCase);

// Rotas públicas (utilizam optionalVerifyToken para identificar se é cliente logado ou visitante)
productRoutes.get('/', optionalVerifyToken, (req, res, next) => productController.getAll(req, res, next));
productRoutes.get('/:id', optionalVerifyToken, (req, res, next) => productController.getById(req, res, next));

// Rotas protegidas exigem autenticação e papéis de Funcionário ou Admin
productRoutes.post('/', verifyToken, checkRole(['EMPLOYEE', 'ADMIN']), (req, res, next) => productController.create(req, res, next));
productRoutes.put('/:id', verifyToken, checkRole(['EMPLOYEE', 'ADMIN']), (req, res, next) => productController.update(req, res, next));
productRoutes.delete('/:id', verifyToken, checkRole(['EMPLOYEE', 'ADMIN']), (req, res, next) => productController.delete(req, res, next));

export { productRoutes };