import { ServiceOrderPresenter } from '../presenters/ServiceOrderPresenter.js';

export class ServiceOrderController {
    constructor(serviceOrderUseCase) {
        this.serviceOrderUseCase = serviceOrderUseCase;
    }

    // Auxiliar interno para aplicar a apresentação correta baseada no papel do usuário
    present(order, requesterUser) {
        const permission = requesterUser?.isAdmin() || requesterUser?.isEmployee();
        return permission ? ServiceOrderPresenter.toPrivate(order) : ServiceOrderPresenter.toPublic(order);
    }

    // Trata a criação de uma nova Ordem de Serviço via HTTP
    async create(req, res, next) {
        try {
            const osData = req.body;
            const requesterUser = req.user;
            const created = await this.serviceOrderUseCase.createServiceOrder(osData, requesterUser);
            return res.status(201).json({ status: 'success', data: this.present(created, requesterUser) });
        } catch (error) {
            return next(error);
        }
    }

    // Trata a listagem de Ordens de Serviço aplicando filtros e permissões
    async getAll(req, res, next) {
        try {
            const filters = req.query;
            const requesterUser = req.user;
            const orders = await this.serviceOrderUseCase.getAllServiceOrders(filters, requesterUser);
            return res.status(200).json({
                status: 'success',
                data: orders.map(order => this.present(order, requesterUser))
            });
        } catch (error) {
            return next(error);
        }
    }

    // Trata a busca de uma OS detalhada por ID
    async getById(req, res, next) {
        try {
            const { id } = req.params;
            const requesterUser = req.user;
            const os = await this.serviceOrderUseCase.getServiceOrderById(id, requesterUser);
            return res.status(200).json({ status: 'success', data: this.present(os, requesterUser) });
        } catch (error) {
            return next(error);
        }
    }

    // Trata a adição de peças/produtos à OS
    async addItem(req, res, next) {
        try {
            const { id } = req.params;
            const itemData = req.body;
            const requesterUser = req.user;
            const updatedOs = await this.serviceOrderUseCase.addItemToServiceOrder(id, itemData, requesterUser);
            return res.status(200).json({ status: 'success', data: this.present(updatedOs, requesterUser) });
        } catch (error) {
            return next(error);
        }
    }

    // Trata a alocação de um funcionário à OS
    async addEmployee(req, res, next) {
        try {
            const { id } = req.params;
            const empData = req.body;
            const requesterUser = req.user;
            const updatedOs = await this.serviceOrderUseCase.addEmployeeToServiceOrder(id, empData, requesterUser);
            return res.status(200).json({ status: 'success', data: this.present(updatedOs, requesterUser) });
        } catch (error) {
            return next(error);
        }
    }

    // Trata a atualização geral de uma Ordem de Serviço
    async update(req, res, next) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const requesterUser = req.user;
            const updatedOs = await this.serviceOrderUseCase.updateServiceOrder(id, updateData, requesterUser);
            return res.status(200).json({ status: 'success', data: this.present(updatedOs, requesterUser) });
        } catch (error) {
            return next(error);
        }
    }

    // Trata a atualização de status da OS (gatilho para estoque e e-mail)
    async updateStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const requesterUser = req.user;
            const updatedOs = await this.serviceOrderUseCase.updateStatus(id, status, requesterUser);
            return res.status(200).json({ status: 'success', data: this.present(updatedOs, requesterUser) });
        } catch (error) {
            return next(error);
        }
    }
    
    // Trata a exclusão de uma Ordem de Serviço
    async remove(req, res, next) {
        try {
            const { id } = req.params;
            const requesterUser = req.user;
            await this.serviceOrderUseCase.deleteServiceOrder(id, requesterUser);
            return res.status(200).json({ status: 'success', message: 'Ordem de Serviço removida com sucesso.' });
        } catch (error) {
            return next(error);
        }
    }

    // Trata a remoção de um item/produto da OS com estorno de estoque
    async removeItem(req, res, next) {
        try {
            const { id, itemId } = req.params;
            const requesterUser = req.user;
            const updatedOs = await this.serviceOrderUseCase.removeItemFromServiceOrder(id, itemId, requesterUser);
            return res.status(200).json({ status: 'success', data: this.present(updatedOs, requesterUser) });
        } catch (error) {
            return next(error);
        }
    }

    // Trata a desalocação de um funcionário da OS
    async removeEmployee(req, res, next) {
        try {
            const { id, employeeId } = req.params;
            const requesterUser = req.user;
            const updatedOs = await this.serviceOrderUseCase.removeEmployeeFromServiceOrder(id, employeeId, requesterUser);
            return res.status(200).json({ status: 'success', data: this.present(updatedOs, requesterUser) });
        } catch (error) {
            return next(error);
        }
    }
}