// Contrato para o repositório de movimentações de estoque
export class IStockMovementRepository {
    // Registra movimentação de estoque de forma transacional e atômica
    async createWithTransaction(stockMovementEntity, newStockBalance, dbClient) { throw new Error('Method not implemented'); }
    
    // Retorna o histórico de movimentações filtrado por produto
    async findByProductId(productId) { throw new Error('Method not implemented'); }
    
    // Retorna todas as movimentações de estoque
    async findAll() { throw new Error('Method not implemented'); }
}