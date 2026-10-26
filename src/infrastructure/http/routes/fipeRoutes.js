import { Router } from 'express';
import { FipeController } from '../../../adapters/controllers/FipeController.js';
import { FipeUseCase } from '../../../use-cases/fipe/FipeUseCase.js';
import { FipeService } from '../../external-services/fipe/FipeService.js';
import { verifyToken } from '../middlewares/verifyToken.js';

const fipeRoutes = Router();

const fipeService = new FipeService();
const fipeUseCase = new FipeUseCase(fipeService);
const fipeController = new FipeController(fipeUseCase);

// Todas as rotas FIPE exigem autenticação prévia (funcionários ou admins consultando para abrir OS)
fipeRoutes.get('/plate/:plate', verifyToken, (req, res, next) => fipeController.getByPlate(req, res, next));
fipeRoutes.get('/brands', verifyToken, (req, res, next) => fipeController.getBrands(req, res, next));
fipeRoutes.get('/brands/:brandId/models', verifyToken, (req, res, next) => fipeController.getModels(req, res, next));
fipeRoutes.get('/brands/:brandId/models/:modelId/years', verifyToken, (req, res, next) => fipeController.getYears(req, res, next));
fipeRoutes.get('/price', verifyToken, (req, res, next) => fipeController.getPrice(req, res, next));

export { fipeRoutes };