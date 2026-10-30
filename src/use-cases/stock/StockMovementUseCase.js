import { randomUUID } from 'crypto';
import { StockMovement } from '../../domain/entities/StockMovement.js';
import { ValidationError, NotFoundError, BusinessRuleError } from '../../domain/errors/DomainErrors.js';
import { isUuid } from '../../domain/validators.js';

const ALLOWED_TYPES = ['ENTRADA', 'SAIDA', 'AJUSTE'];

export class StockMovementUseCase {
    constructor(stockMovementRepository, productRepository, transactionManager) {
        this.stockMovementRepository = stockMovementRepository;
        this.productRepository = productRepository;
        this.transactionManager = transactionManager;
    }

    // Executa movimentação manual de estoque com transação atômica via TransactionManager
    async createStockMovement(productId, { type, quantity, reason }, requesterUser) {
        if (!requesterUser || (!requesterUser.isAdmin() && !requesterUser.isEmployee())) {
            throw new BusinessRuleError('Acesso negado. Apenas funcionários ou administradores podem movimentar o estoque.');
        }

        if (!productId || !isUuid(productId)) {
            throw new ValidationError('ID de produto inválido.');
        }

        if (!type || !ALLOWED_TYPES.includes(type)) {
            throw new ValidationError('Tipo de movimentação inválido. Use ENTRADA, SAIDA ou AJUSTE.');
        }

        const qty = Number(quantity);
        if (isNaN(qty) || qty <= 0) {
            throw new ValidationError('A quantidade deve ser maior que zero.');
        }

        return await this.transactionManager.transaction(async (client) => {
            const product = await this.productRepository.findById(productId, client);
            if (!product) {
                throw new NotFoundError('Produto não encontrado.');
            }

            let newBalance = product.current_stock;
            if (type === 'ENTRADA') {
                newBalance += qty;
            } else if (type === 'SAIDA') {
                newBalance -= qty;
                if (newBalance < 0) {
                    throw new BusinessRuleError('Estoque insuficiente para realizar esta saída.');
                }
            } else if (type === 'AJUSTE') {
                newBalance = qty;
            }

            const movementId = randomUUID();
            const movementEntity = new StockMovement({
                id: movementId,
                product_id: productId,
                type,
                quantity: qty,
                balance_after: newBalance,
                reason: reason || 'Movimentação manual de estoque'
            });

            const createdMovement = await this.stockMovementRepository.createWithTransaction(movementEntity, newBalance, client);
            return createdMovement;
        });
    }

    // Busca histórico de movimentações por produto
    async getMovementsByProductId(productId, requesterUser) {
        if (!requesterUser || (!requesterUser.isAdmin() && !requesterUser.isEmployee())) {
            throw new BusinessRuleError('Acesso negado.');
        }
        if (!productId || !isUuid(productId)) {
            throw new ValidationError('ID de produto inválido.');
        }
        const product = await this.productRepository.findById(productId);
        if (!product) throw new NotFoundError('Produto não encontrado.');

        const movements = await this.stockMovementRepository.findByProductId(productId);
        return movements;
    }

    // Lista todas as movimentações do sistema
    async getAllMovements(requesterUser) {
        if (!requesterUser || (!requesterUser.isAdmin() && !requesterUser.isEmployee())) {
            throw new BusinessRuleError('Acesso negado.');
        }
        const movements = await this.stockMovementRepository.findAll();
        return movements;
    }
}