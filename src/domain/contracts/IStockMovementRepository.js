// Contrato para o repositório de movimentações de estoque
export class IStockMovementRepository {
    // Registra movimentação de estoque de forma transacional e atômica
    async createWithTransaction(_stockMovementEntity, _newStockBalance, _dbClient) { throw new Error('Method not implemented'); }
    
    // Retorna o histórico de movimentações filtrado por produto
    async findByProductId(_productId) { throw new Error('Method not implemented'); }
    
    // Retorna todas as movimentações de estoque
    async findAll() { throw new Error('Method not implemented'); }
}