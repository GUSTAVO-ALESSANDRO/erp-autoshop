// Contrato para o repositório de Ordens de Serviço (OS)
export class IServiceOrderRepository {
    // Insere uma nova Ordem de Serviço
    async create(entity, dbClient) { throw new Error('Method not implemented'); }
    
    // Busca OS por ID carregando itens e funcionários associados
    async findById(id, dbClient, forUpdate) { throw new Error('Method not implemented'); }
    
    // Lista todas as Ordens de Serviço aplicando filtros
    async findAll(filters) { throw new Error('Method not implemented'); }
    
    // Adiciona peça/item à Ordem de Serviço
    async addItem(osId, itemEntity, dbClient) { throw new Error('Method not implemented'); }
    
    // Aloca funcionário à Ordem de Serviço
    async addEmployee(osId, employeeId, dbClient) { throw new Error('Method not implemented'); }
    
    // Atualiza o status da Ordem de Serviço
    async updateStatus(id, newStatus, dbClient) { throw new Error('Method not implemented'); }
    
    // Atualiza o valor total monetário da OS
    async updateTotalAmount(id, totalAmount, dbClient) { throw new Error('Method not implemented'); }
}