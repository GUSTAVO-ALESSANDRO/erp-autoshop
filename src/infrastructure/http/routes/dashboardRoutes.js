import { Router } from 'express';
import { DashboardController } from '../../../adapters/controllers/DashboardController.js';
import { DashboardUseCase } from '../../../use-cases/dashboard/DashboardUseCase.js';
import { PostgresDashboardRepository } from '../../repositories/PostgresDashboardRepository.js';
import { verifyToken } from '../middlewares/verifyToken.js';
import { checkRole } from '../middlewares/checkRole.js';

const dashboardRoutes = Router();

const dashboardRepository = new PostgresDashboardRepository();
const dashboardUseCase = new DashboardUseCase(dashboardRepository);
const dashboardController = new DashboardController(dashboardUseCase);

// Rotas restritas exclusivamente para administradores
dashboardRoutes.get('/summary', verifyToken, checkRole(['ADMIN']), (req, res, next) => dashboardController.getSummary(req, res, next));
dashboardRoutes.get('/financial', verifyToken, checkRole(['ADMIN']), (req, res, next) => dashboardController.getFinancial(req, res, next));

export { dashboardRoutes };