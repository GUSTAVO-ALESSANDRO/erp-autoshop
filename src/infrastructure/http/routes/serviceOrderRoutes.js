import { Router } from 'express';
import { ServiceOrderController } from '../../../adapters/controllers/ServiceOrderController.js';
import { ServiceOrderUseCase } from '../../../use-cases/service-order/ServiceOrderUseCase.js';
import { PostgresServiceOrderRepository } from '../../repositories/PostgresServiceOrderRepository.js';
import { PostgresProductRepository } from '../../repositories/PostgresProductRepository.js';
import { PostgresUserRepository } from '../../repositories/PostgresUserRepository.js';
import { EmailService } from '../../external-services/mail/EmailService.js';
import { verifyToken } from '../middlewares/verifyToken.js';
import { checkRole } from '../middlewares/checkRole.js';

const serviceOrderRoutes = Router();

// Instanciação manual das dependências e repositórios necessários
const serviceOrderRepository = new PostgresServiceOrderRepository();
const productRepository = new PostgresProductRepository();
const userRepository = new PostgresUserRepository();
const emailService = new EmailService();

// Instancia o caso de uso injetando os repositórios e serviços de e-mail
const serviceOrderUseCase = new ServiceOrderUseCase(
    serviceOrderRepository,
    productRepository,
    userRepository,
    emailService
);

// Instancia o controller passando o caso de uso correspondente
const serviceOrderController = new ServiceOrderController(serviceOrderUseCase);

serviceOrderRoutes.post('/', verifyToken, (req, res, next) => serviceOrderController.create(req, res, next));
serviceOrderRoutes.get('/', verifyToken, (req, res, next) => serviceOrderController.getAll(req, res, next));
serviceOrderRoutes.get('/:id', verifyToken, (req, res, next) => serviceOrderController.getById(req, res, next));
serviceOrderRoutes.post('/:id/items', verifyToken, checkRole(['EMPLOYEE', 'ADMIN']), (req, res, next) => serviceOrderController.addItem(req, res, next));
serviceOrderRoutes.post('/:id/employees', verifyToken, checkRole(['EMPLOYEE', 'ADMIN']), (req, res, next) => serviceOrderController.addEmployee(req, res, next));
serviceOrderRoutes.patch('/:id/status', verifyToken, checkRole(['EMPLOYEE', 'ADMIN']), (req, res, next) => serviceOrderController.updateStatus(req, res, next));

export { serviceOrderRoutes };