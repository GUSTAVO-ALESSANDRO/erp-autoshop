import { randomUUID } from 'crypto';
import { ServiceOrder } from '../../domain/entities/ServiceOrder.js';
import { ServiceOrderItem } from '../../domain/entities/ServiceOrderItem.js';
import { ValidationError, NotFoundError, BusinessRuleError } from '../../domain/errors/DomainErrors.js';
import { isUuid, validateMinName, parseNonNegativeAmount } from '../../domain/validators.js';

export class ServiceOrderUseCase {
    // Construtor atualizado recebendo os repositórios por contrato e o gerenciador de transações
    constructor(serviceOrderRepository, productRepository, userRepository, emailService, transactionManager) {
        this.serviceOrderRepository = serviceOrderRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.transactionManager = transactionManager;
    }

    // Cria uma nova OS gerando o código sequencial via transação isolada na infraestrutura
    async createServiceOrder(orderData = {}, requesterUser) {

        // Bloqueia clientes de criarem OS
        if (!requesterUser || (!requesterUser.isAdmin() && !requesterUser.isEmployee())) {
            throw new BusinessRuleError('Acesso negado. Apenas funcionários ou administradores podem criar Ordens de Serviço.');
        }
        
        const {
            customer_id,
            vehicle_brand,
            vehicle_model,
            vehicle_year,
            vehicle_fipe_code,
            title,
            description,
            labor_cost = 0,
            discount = 0
        } = orderData || {};
        let targetCustomerId = customer_id;

        // Se o solicitante for cliente, força o ID para o seu próprio usuário
        if (requesterUser?.isCustomer()) {
            targetCustomerId = requesterUser.id;
        } else {
            if (!targetCustomerId || !isUuid(targetCustomerId)) {
                throw new ValidationError('ID do cliente é obrigatório e deve ser um UUID válido.');
            }
            const customer = await this.userRepository.findById(targetCustomerId);
            if (!customer || !customer.isCustomer()) {
                throw new NotFoundError('Cliente não encontrado ou ID inválido.');
            }
        }

        validateMinName(vehicle_brand, 'marca do veículo', 2);
        validateMinName(vehicle_model, 'modelo do veículo', 2);
        validateMinName(title, 'título da ordem de serviço', 3);

        const laborCostNum = parseNonNegativeAmount(labor_cost, 'custo de mão de obra');
        const discountNum = parseNonNegativeAmount(discount, 'desconto');
        if (discountNum > laborCostNum) {
            throw new ValidationError('O desconto não pode ser maior que o subtotal da Ordem de Serviço.');
        }

        const year = new Date().getFullYear();
        const osId = randomUUID();

        const serviceOrderEntity = new ServiceOrder({
            id: osId,
            code: null,
            customer_id: targetCustomerId,
            vehicle_brand: vehicle_brand.trim(),
            vehicle_model: vehicle_model.trim(),
            vehicle_year: vehicle_year || 'N/I',
            vehicle_fipe_code: vehicle_fipe_code || null,
            title: title.trim(),
            description: description || '',
            status: 'ORCAMENTO',
            labor_cost: laborCostNum,
            discount: discountNum,
            total_amount: laborCostNum - discountNum
        });

        // Delega a atomicidade e o controle de concorrência transacional para o transactionManager
        return await this.transactionManager.transaction(async (client) => {
            const nextSequence = await this.serviceOrderRepository.getNextSequence(year, client);
            serviceOrderEntity.code = `OS-${year}-${String(nextSequence).padStart(3, '0')}`;
            const created = await this.serviceOrderRepository.create(serviceOrderEntity, client);
            return created;
        });
    }

    // Retorna listagem de OS aplicando restrições de visibilidade por perfil
    async getAllServiceOrders(filters, requesterUser) {
        const queryFilters = { ...filters };

        // Clientes só conseguem enxergar as próprias OS
        if (requesterUser?.isCustomer()) {
            queryFilters.customer_id = requesterUser.id;
        }

        const orders = await this.serviceOrderRepository.findAll(queryFilters);
        return orders;
    }

    // Busca OS por ID validando se o usuário possui permissão de leitura
    async getServiceOrderById(id, requesterUser) {
        if (!id || !isUuid(id)) {
            throw new ValidationError('ID de Ordem de Serviço inválido.');
        }

        const os = await this.serviceOrderRepository.findById(id);
        if (!os) {
            throw new NotFoundError('Ordem de Serviço não encontrada.');
        }

        if (requesterUser?.isCustomer() && os.customer_id !== requesterUser.id) {
            throw new BusinessRuleError('Acesso negado. Você só pode visualizar suas próprias Ordens de Serviço.');
        }

        return os;
    }

    // Adiciona uma peça à OS e congela seus valores unitários para o histórico de forma atômica
    async addItemToServiceOrder(osId, itemData = {}, requesterUser) {
        const { product_id, quantity } = itemData || {};
        if (!requesterUser || (!requesterUser.isAdmin() && !requesterUser.isEmployee())) {
            throw new BusinessRuleError('Acesso negado. Apenas funcionários ou administradores podem adicionar peças.');
        }

        if (!osId || !isUuid(osId) || !product_id || !isUuid(product_id)) {
            throw new ValidationError('IDs de OS e Produto são obrigatórios e devem ser UUIDs válidos.');
        }

        const qty = Number(quantity);
        if (!Number.isSafeInteger(qty) || qty <= 0) {
            throw new ValidationError('A quantidade deve ser um número inteiro maior que zero.');
        }

        const product = await this.productRepository.findById(product_id);
        if (!product || !product.is_active) {
            throw new NotFoundError('Produto não encontrado ou inativo.');
        }

        const itemId = randomUUID();
        const itemEntity = new ServiceOrderItem({
            id: itemId,
            os_id: osId,
            product_id,
            quantity: qty,
            unit_cost_price: product.cost_price,
            unit_sell_price: product.sell_price
        });

        return await this.transactionManager.transaction(async (client) => {
            const os = await this.serviceOrderRepository.findById(osId, client, true);
            if (!os) {
                throw new NotFoundError('Ordem de Serviço não encontrada.');
            }
            
            // Permite adicionar em ORCAMENTO, APROVADO ou EM_EXECUCAO, bloqueando apenas em OS concluídas ou canceladas
            if (['CONCLUIDO', 'CANCELADO'].includes(os.status)) {
                throw new BusinessRuleError('Não é permitido adicionar peças em Ordens de Serviço concluídas ou canceladas.');
            }

            await this.serviceOrderRepository.addItem(osId, itemEntity, client);
            const updatedOs = await this.serviceOrderRepository.findById(osId, client);
            const itemsTotal = updatedOs.items.reduce((sum, item) => sum + (item.quantity * item.unit_sell_price), 0);
            const subtotal = itemsTotal + updatedOs.labor_cost;
            if (updatedOs.discount > subtotal) {
                throw new ValidationError('O desconto não pode ser maior que o subtotal da Ordem de Serviço.');
            }
            await this.serviceOrderRepository.updateTotalAmount(osId, subtotal - updatedOs.discount, client);
            const finalOs = await this.serviceOrderRepository.findById(osId, client);
            return finalOs;
        });
    }

    // Aloca um funcionário/mecânico à Ordem de Serviço (com validação de estado e duplicidade)
    async addEmployeeToServiceOrder(osId, { employee_id }, requesterUser) {
        if (!requesterUser || (!requesterUser.isAdmin() && !requesterUser.isEmployee())) {
            throw new BusinessRuleError('Acesso negado.');
        }

        if (!osId || !isUuid(osId) || !employee_id || !isUuid(employee_id)) {
            throw new ValidationError('IDs inválidos.');
        }

        const os = await this.serviceOrderRepository.findById(osId);
        if (!os) throw new NotFoundError('Ordem de Serviço não encontrada.');

        // Valida se a OS já está concluída ou cancelada
        if (['CONCLUIDO', 'CANCELADO'].includes(os.status)) {
            throw new BusinessRuleError('Não é permitido alocar funcionários em Ordens de Serviço concluídas ou canceladas.');
        }

        // Valida se o funcionário já está alocado nesta OS
        const alreadyAllocated = os.employees && os.employees.some(emp => (emp.id === employee_id || emp.employee_id === employee_id));
        if (alreadyAllocated) {
            throw new BusinessRuleError('Este funcionário já está alocado nesta Ordem de Serviço.');
        }

        const employee = await this.userRepository.findById(employee_id);
        if (!employee || (!employee.isEmployee() && !employee.isAdmin())) {
            throw new ValidationError('O usuário informado não é um funcionário válido.');
        }

        await this.serviceOrderRepository.addEmployee(osId, employee_id);
        const finalOs = await this.serviceOrderRepository.findById(osId);
        return finalOs;
    }

    // Gerencia transição de status da OS com baixa transacional ACID e e-mails
    async updateStatus(osId, newStatus, requesterUser) {
        if (!requesterUser || (!requesterUser.isAdmin() && !requesterUser.isEmployee())) {
            throw new BusinessRuleError('Acesso negado para alterar o status da OS.');
        }

        if (!osId || !isUuid(osId)) {
            throw new ValidationError('ID de Ordem de Serviço inválido.');
        }
        const validStatuses = ['ORCAMENTO', 'APROVADO', 'EM_EXECUCAO', 'CONCLUIDO', 'CANCELADO'];
        if (!validStatuses.includes(newStatus)) {
            throw new ValidationError('Status inválido.');
        }

        let os;
        await this.transactionManager.transaction(async (client) => {
            os = await this.serviceOrderRepository.findById(osId, client, true);
            if (!os) throw new NotFoundError('Ordem de Serviço não encontrada.');

            if (newStatus === os.status) {
                return os;
            }

            const allowedTransitions = {
                ORCAMENTO: ['APROVADO', 'EM_EXECUCAO', 'CANCELADO'],
                APROVADO: ['EM_EXECUCAO', 'CANCELADO'],
                EM_EXECUCAO: ['CONCLUIDO'],
                CONCLUIDO: [],
                CANCELADO: []
            };
            if (!allowedTransitions[os.status]?.includes(newStatus)) {
                throw new BusinessRuleError(`Não é permitido alterar o status de ${os.status} para ${newStatus}.`);
            }

            // Delega a baixa de estoque transacional para o repositório
            if (newStatus === 'EM_EXECUCAO') {
                await this.serviceOrderRepository.processStockDeduction(os, client);
            }

            await this.serviceOrderRepository.updateStatus(osId, newStatus, client);
        });

        // Envio de e-mail assíncrono após o commit da transação
        if (newStatus === 'CONCLUIDO' && os.status !== 'CONCLUIDO') {
            try {
                const customer = await this.userRepository.findById(os.customer_id);
                if (customer && customer.email) {
                    await this.emailService.sendServiceOrderCompletedEmail(
                        customer.email,
                        os.code,
                        `${os.vehicle_brand} ${os.vehicle_model} (${os.vehicle_year})`,
                        os.total_amount
                    );
                }
            } catch (err) {
                console.error('Falha ao enviar e-mail de conclusão de OS:', err);
            }
        }

        const finalOs = await this.serviceOrderRepository.findById(osId);
        return finalOs;
    }
}