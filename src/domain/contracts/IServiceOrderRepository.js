// Contrato para o repositório de Ordens de Serviço (OS)
export class IServiceOrderRepository {
    // Insere uma nova Ordem de Serviço
    async create(_entity, _dbClient) { throw new Error('Method not implemented'); }
    
    // Busca OS por ID carregando itens e funcionários associados
    async findById(_id, _dbClient, _forUpdate) { throw new Error('Method not implemented'); }
    
    // Lista todas as Ordens de Serviço aplicando filtros
    async findAll(_filters) { throw new Error('Method not implemented'); }
    
    // Adiciona peça/item à Ordem de Serviço
    async addItem(_osId, _itemEntity, _dbClient) { throw new Error('Method not implemented'); }
    
    // Aloca funcionário à Ordem de Serviço
    async addEmployee(_osId, _employeeId, _dbClient) { throw new Error('Method not implemented'); }
    
    // Atualiza o status da Ordem de Serviço
    async updateStatus(_id, _newStatus, _dbClient) { throw new Error('Method not implemented'); }
    
    // Atualiza o valor total monetário da OS
    async updateTotalAmount(_id, _totalAmount, _dbClient) { throw new Error('Method not implemented'); }
}