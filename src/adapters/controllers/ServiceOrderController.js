export class ServiceOrderController {
    constructor(serviceOrderUseCase) {
        this.serviceOrderUseCase = serviceOrderUseCase;
    }

    // Trata a criação de uma nova Ordem de Serviço via HTTP
    async create(req, res, next) {
        try {
            const osData = req.body;
            const requesterUser = req.user;
            const created = await this.serviceOrderUseCase.createServiceOrder(osData, requesterUser);
            return res.status(201).json({ status: 'success', data: created });
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
            return res.status(200).json({ status: 'success', data: orders });
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
            return res.status(200).json({ status: 'success', data: os });
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
            return res.status(200).json({ status: 'success', data: updatedOs });
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
            return res.status(200).json({ status: 'success', data: updatedOs });
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
            return res.status(200).json({ status: 'success', data: updatedOs });
        } catch (error) {
            return next(error);
        }
    }
}