import { Router } from 'express';
import { StockMovementController } from '../../../adapters/controllers/StockMovementController.js';
import { StockMovementUseCase } from '../../../use-cases/stock/StockMovementUseCase.js';
import { PostgresStockMovementRepository } from '../../repositories/PostgresStockMovementRepository.js';
import { PostgresProductRepository } from '../../repositories/PostgresProductRepository.js';
import { PostgresTransactionManager } from '../../database/PostgresTransactionManager.js';
import { verifyToken } from '../middlewares/verifyToken.js';
import { checkRole } from '../middlewares/checkRole.js';

const stockRoutes = Router();

const stockMovementRepository = new PostgresStockMovementRepository();
const productRepository = new PostgresProductRepository();
const transactionManager = new PostgresTransactionManager();
const stockMovementUseCase = new StockMovementUseCase(
    stockMovementRepository,
    productRepository,
    transactionManager
);
const stockMovementController = new StockMovementController(stockMovementUseCase);

// Rotas protegidas para funcionários e administradores
stockRoutes.get('/', verifyToken, checkRole(['EMPLOYEE', 'ADMIN']), (req, res, next) => stockMovementController.getAll(req, res, next));
stockRoutes.post('/products/:id/stock', verifyToken, checkRole(['EMPLOYEE', 'ADMIN']), (req, res, next) => stockMovementController.create(req, res, next));
stockRoutes.get('/products/:id/stock-movements', verifyToken, checkRole(['EMPLOYEE', 'ADMIN']), (req, res, next) => stockMovementController.getByProduct(req, res, next));

export { stockRoutes };