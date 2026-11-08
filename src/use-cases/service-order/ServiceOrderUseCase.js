import { randomUUID } from 'crypto';
import { ServiceOrder } from '../../domain/entities/ServiceOrder.js';
import { ServiceOrderItem } from '../../domain/entities/ServiceOrderItem.js';
import { ValidationError, NotFoundError, BusinessRuleError } from '../../domain/errors/DomainErrors.js';
import { isUuid, validateMinName, parseNonNegativeAmount } from '../../domain/validators.js';
import { StockMovement } from '../../domain/entities/StockMovement.js';

export class ServiceOrderUseCase {
    // Construtor atualizado recebendo os repositórios por contrato e o gerenciador de transações
    constructor(serviceOrderRepository, productRepository, userRepository, emailService, transactionManager, stockMovementRepository) {
        this.serviceOrderRepository = serviceOrderRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.transactionManager = transactionManager;
        this.stockMovementRepository = stockMovementRepository;
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
            const clientUser = await this.userRepository.findById(targetCustomerId);
            if (!clientUser || !clientUser.isActive) {
                throw new NotFoundError('Usuário não encontrado ou inativo.');
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

            // Valida o estoque atual com bloqueio (FOR UPDATE) usando o repositório de produtos ou stock
            const currentStock = await this.productRepository.getCurrentStockWithLock(product_id, client);
            if (currentStock === null) {
                throw new NotFoundError('Produto não encontrado.');
            }

            if (currentStock < qty) {
                throw new BusinessRuleError(`Estoque insuficiente para o produto. Disponível: ${currentStock}, Solicitado: ${qty}`);
            }

            const newBalance = currentStock - qty;

            // Cria a entidade de movimentação de estoque (SAÍDA)
            const stockMovement = new StockMovement({
                id: randomUUID(),
                product_id: product_id,
                type: 'SAIDA',
                quantity: qty,
                balance_after: newBalance,
                reason: `Uso na Ordem de Serviço ${os.code}`
            });

            // Executa a baixa transacional e registro no histórico através do repositório de estoque
            await this.stockMovementRepository.createWithTransaction(stockMovement, newBalance, client);

            // Adiciona o item na Ordem de Serviço
            await this.serviceOrderRepository.addItem(osId, itemEntity, client);

            // Recalcula o valor total da OS
            const updatedOs = await this.serviceOrderRepository.findById(osId, client);
            const itemsTotal = updatedOs.items.reduce((sum, item) => sum + (item.quantity * item.unit_sell_price), 0);
            const subtotal = itemsTotal + updatedOs.labor_cost;
            if (updatedOs.discount > subtotal) {
                throw new ValidationError('O desconto não pode ser maior que o subtotal da Ordem de Serviço.');
            }
            await this.serviceOrderRepository.updateTotalAmount(osId, subtotal - updatedOs.discount, client);

            return await this.serviceOrderRepository.findById(osId, client);
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

    // Atualiza os dados cadastrais e financeiros de uma Ordem de Serviço existente
    async updateServiceOrder(osId, updateData = {}, requesterUser) {
        if (!requesterUser || (!requesterUser.isAdmin() && !requesterUser.isEmployee())) {
            throw new BusinessRuleError('Acesso negado. Apenas funcionários ou administradores podem atualizar Ordens de Serviço.');
        }

        if (!osId || !isUuid(osId)) {
            throw new ValidationError('ID de Ordem de Serviço inválido.');
        }

        const {
            vehicle_brand,
            vehicle_model,
            vehicle_year,
            vehicle_fipe_code,
            title,
            description,
            labor_cost,
            discount
        } = updateData || {};

        return await this.transactionManager.transaction(async (client) => {
            // Busca a OS com bloqueio para concorrência
            const os = await this.serviceOrderRepository.findById(osId, client, true);
            if (!os) {
                throw new NotFoundError('Ordem de Serviço não encontrada.');
            }

            // Impede alterações se a OS já estiver concluída ou cancelada
            if (['CONCLUIDO', 'CANCELADO'].includes(os.status)) {
                throw new BusinessRuleError('Não é permitido alterar Ordens de Serviço concluídas ou canceladas.');
            }

            // Atualiza os campos se fornecidos, mantendo os antigos caso contrário
            if (vehicle_brand !== undefined) {
                validateMinName(vehicle_brand, 'marca do veículo', 2);
                os.vehicle_brand = vehicle_brand.trim();
            }
            if (vehicle_model !== undefined) {
                validateMinName(vehicle_model, 'modelo do veículo', 2);
                os.vehicle_model = vehicle_model.trim();
            }
            if (vehicle_year !== undefined) {
                os.vehicle_year = vehicle_year || 'N/I';
            }
            if (vehicle_fipe_code !== undefined) {
                os.vehicle_fipe_code = vehicle_fipe_code || null;
            }
            if (title !== undefined) {
                validateMinName(title, 'título da ordem de serviço', 3);
                os.title = title.trim();
            }
            if (description !== undefined) {
                os.description = description || '';
            }

            if (labor_cost !== undefined) {
                os.labor_cost = parseNonNegativeAmount(labor_cost, 'custo de mão de obra');
            }

            if (discount !== undefined) {
                os.discount = parseNonNegativeAmount(discount, 'desconto');
            }

            // Recalcula o total com base nos itens atuais + nova mão de obra - desconto
            const itemsTotal = os.items.reduce((sum, item) => sum + (item.quantity * item.unit_sell_price), 0);
            const subtotal = itemsTotal + os.labor_cost;

            if (os.discount > subtotal) {
                throw new ValidationError('O desconto não pode ser maior que o subtotal da Ordem de Serviço.');
            }

            os.total_amount = subtotal - os.discount;

            // Salva no banco de dados dentro da transação
            await this.serviceOrderRepository.update(os, client);

            return await this.serviceOrderRepository.findById(osId, client);
        });
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

    // Exclui uma Ordem de Serviço e estorna o estoque de todos os seus itens (gerando ENTRADA em stock_movements)
    async deleteServiceOrder(osId, requesterUser) {
        if (!requesterUser || (!requesterUser.isAdmin() && !requesterUser.isEmployee())) {
            throw new BusinessRuleError('Acesso negado.');
        }
        if (!osId || !isUuid(osId)) {
            throw new ValidationError('ID de OS inválido.');
        }

        return await this.transactionManager.transaction(async (client) => {
            const os = await this.serviceOrderRepository.findById(osId, client, true);
            if (!os) throw new NotFoundError('Ordem de Serviço não encontrada.');

            if (os.status === 'CONCLUIDO') {
                throw new BusinessRuleError('Não é permitido excluir uma Ordem de Serviço já concluída.');
            }

            // Estorna cada item da OS de volta ao estoque
            for (const item of os.items) {
                const prodRes = await client.query('SELECT current_stock FROM products WHERE id = $1 FOR UPDATE', [item.product_id]);
                if (prodRes.rows[0]) {
                    const currentStock = Number(prodRes.rows[0].current_stock);
                    const newBalance = currentStock + item.quantity;

                    // Atualiza o estoque do produto
                    await client.query('UPDATE products SET current_stock = $1 WHERE id = $2', [newBalance, item.product_id]);
                    
                    // Registra a movimentação de ENTRADA no histórico
                    await client.query(
                        `INSERT INTO stock_movements (id, product_id, type, quantity, balance_after, reason, created_at)
                         VALUES (gen_random_uuid(), $1, 'ENTRADA', $2, $3, $4, NOW())`,
                        [item.product_id, item.quantity, newBalance, `Estorno por exclusão da OS ${os.code}`]
                    );
                }
            }

            await this.serviceOrderRepository.removeAllItemsByOsId(osId, client);
            await this.serviceOrderRepository.removeAllEmployeesByOsId(osId, client);
            await this.serviceOrderRepository.delete(osId, client);
        });
    }

    // Remove um item específico da OS e estorna a quantidade para o estoque (gerando ENTRADA em stock_movements)
    async removeItemFromServiceOrder(osId, itemId, requesterUser) {
        if (!requesterUser || (!requesterUser.isAdmin() && !requesterUser.isEmployee())) {
            throw new BusinessRuleError('Acesso negado.');
        }
        if (!osId || !isUuid(osId) || !itemId || !isUuid(itemId)) {
            throw new ValidationError('IDs inválidos.');
        }

        return await this.transactionManager.transaction(async (client) => {
            const os = await this.serviceOrderRepository.findById(osId, client, true);
            if (!os) throw new NotFoundError('Ordem de Serviço não encontrada.');

            if (['CONCLUIDO', 'CANCELADO'].includes(os.status)) {
                throw new BusinessRuleError('Não é permitido alterar itens de Ordens de Serviço concluídas ou canceladas.');
            }

            const item = os.items.find(i => i.id === itemId);
            if (!item) {
                throw new NotFoundError('Item não encontrado nesta Ordem de Serviço.');
            }

            // Remove o item e recupera os dados dele
            const deletedItem = await this.serviceOrderRepository.removeItem(itemId, client);
            if (deletedItem) {
                // Estorna o estoque do produto correspondente
                const prodRes = await client.query('SELECT current_stock FROM products WHERE id = $1 FOR UPDATE', [deletedItem.product_id]);
                if (prodRes.rows[0]) {
                    const currentStock = Number(prodRes.rows[0].current_stock);
                    const newBalance = currentStock + Number(deletedItem.quantity);

                    // Atualiza o estoque
                    await client.query('UPDATE products SET current_stock = $1 WHERE id = $2', [newBalance, deletedItem.product_id]);
                    
                    // Registra a movimentação de ENTRADA no histórico
                    await client.query(
                        `INSERT INTO stock_movements (id, product_id, type, quantity, balance_after, reason, created_at)
                         VALUES (gen_random_uuid(), $1, 'ENTRADA', $2, $3, $4, NOW())`,
                        [deletedItem.product_id, deletedItem.quantity, newBalance, `Estorno por remoção de item da OS ${os.code}`]
                    );
                }
            }

            // Recalcula o valor total da OS
            const updatedOs = await this.serviceOrderRepository.findById(osId, client);
            const itemsTotal = updatedOs.items.reduce((sum, i) => sum + (i.quantity * i.unit_sell_price), 0);
            const subtotal = itemsTotal + updatedOs.labor_cost;
            const finalTotal = Math.max(0, subtotal - updatedOs.discount);
            await this.serviceOrderRepository.updateTotalAmount(osId, finalTotal, client);

            return await this.serviceOrderRepository.findById(osId, client);
        });
    }

    // Desaloca funcionário da OS
    async removeEmployeeFromServiceOrder(osId, employeeId, requesterUser) {
        if (!requesterUser || (!requesterUser.isAdmin() && !requesterUser.isEmployee())) {
            throw new BusinessRuleError('Acesso negado.');
        }
        if (!osId || !isUuid(osId) || !employeeId || !isUuid(employeeId)) {
            throw new ValidationError('IDs inválidos.');
        }

        const os = await this.serviceOrderRepository.findById(osId);
        if (!os) throw new NotFoundError('Ordem de Serviço não encontrada.');

        if (['CONCLUIDO', 'CANCELADO'].includes(os.status)) {
            throw new BusinessRuleError('Não é permitido alterar alocações em Ordens de Serviço concluídas ou canceladas.');
        }

        // Verifica se o funcionário realmente está alocado nesta OS
        const isAssigned = os.employees && os.employees.some(emp => emp.employee_id === employeeId || emp.id === employeeId);
        if (!isAssigned) {
            throw new NotFoundError('Funcionário não encontrado nesta Ordem de Serviço.');
        }

        return await this.transactionManager.transaction(async (client) => {
            await this.serviceOrderRepository.removeEmployee(osId, employeeId, client);
            return await this.serviceOrderRepository.findById(osId, client);
        });
    }
}