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
        if (Number.isNaN(qty) || qty <= 0) {
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

    // Atualiza uma movimentação de estoque e reajusta o saldo do produto via repositórios
    async updateStockMovement(movementId, updateData, requesterUser) {
        if (!requesterUser || (!requesterUser.isAdmin() && !requesterUser.isEmployee())) {
            throw new BusinessRuleError('Acesso negado.');
        }
        if (!movementId || !isUuid(movementId)) {
            throw new ValidationError('ID de movimentação inválido.');
        }

        const { type, quantity, reason } = updateData || {};

        return await this.transactionManager.transaction(async (client) => {
            const oldMov = await this.stockMovementRepository.findById(movementId, client, true);
            if (!oldMov) {
                throw new NotFoundError('Movimentação de estoque não encontrada.');
            }

            const product = await this.productRepository.findById(oldMov.product_id, client);
            if (!product) throw new NotFoundError('Produto associado não encontrado.');

            // Reverte o efeito da movimentação Antiga no estoque atual
            let stockWithoutOld = product.current_stock;
            if (oldMov.type === 'ENTRADA') {
                stockWithoutOld -= oldMov.quantity;
            } else if (oldMov.type === 'SAIDA') {
                stockWithoutOld += oldMov.quantity;
            } else if (oldMov.type === 'AJUSTE') {
                stockWithoutOld = product.current_stock;
            }

            // Define e valida os novos valores enviados
            const newType = type ? type.toUpperCase() : oldMov.type;
            if (!ALLOWED_TYPES.includes(newType)) {
                throw new ValidationError('Tipo de movimentação inválido. Use ENTRADA, SAIDA ou AJUSTE.');
            }

            const newQty = quantity !== undefined ? Number(quantity) : oldMov.quantity;
            if (isNaN(newQty) || newQty <= 0) {
                throw new ValidationError('A quantidade deve ser maior que zero.');
            }

            const newReason = reason !== undefined ? reason : oldMov.reason;

            // Aplica o efeito da movimentação NOVA
            let newBalance = stockWithoutOld;
            if (newType === 'ENTRADA') {
                newBalance += newQty;
            } else if (newType === 'SAIDA') {
                newBalance -= newQty;
            } else if (newType === 'AJUSTE') {
                newBalance = newQty;
            }

            if (newBalance < 0) {
                throw new BusinessRuleError('A atualização resultaria em estoque negativo.');
            }

            // Atualiza o produto e a movimentação no banco de dados
            await this.productRepository.updateStock(oldMov.product_id, newBalance, client);
            const updatedMovement = await this.stockMovementRepository.update(
                movementId, 
                newType, 
                newQty, 
                newBalance, 
                newReason, 
                client
            );
            
            return updatedMovement;
        });
    }

    // Remove uma movimentação de estoque estornando seu efeito no saldo do produto
    async deleteStockMovement(movementId, requesterUser) {
        if (!requesterUser || (!requesterUser.isAdmin() && !requesterUser.isEmployee())) {
            throw new BusinessRuleError('Acesso negado.');
        }
        if (!movementId || !isUuid(movementId)) {
            throw new ValidationError('ID de movimentação inválido.');
        }

        return await this.transactionManager.transaction(async (client) => {
            const mov = await this.stockMovementRepository.findById(movementId, client, true);
            if (!mov) {
                throw new NotFoundError('Movimentação de estoque não encontrada.');
            }

            const product = await this.productRepository.findById(mov.product_id, client);
            if (!product) throw new NotFoundError('Produto associado não encontrado.');

            let newBalance = product.current_stock;
            if (mov.type === 'ENTRADA') {
                newBalance -= mov.quantity;
            } else if (mov.type === 'SAIDA') {
                newBalance += mov.quantity;
            }

            if (newBalance < 0) {
                throw new BusinessRuleError('Não é possível remover esta movimentação pois deixaria o estoque negativo.');
            }

            await this.productRepository.updateStock(mov.product_id, newBalance, client);
            await this.stockMovementRepository.delete(movementId, client);
        });
    }
}