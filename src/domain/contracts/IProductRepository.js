// Contrato para o repositório de produtos
export class IProductRepository {
    // Busca um produto pelo ID único
    async findById(id) { throw new Error('Method not implemented'); }
    
    // Insere um novo produto
    async create(productEntity) { throw new Error('Method not implemented'); }
    
    // Retorna todos os produtos cadastrados
    async findAll() { throw new Error('Method not implemented'); }
    
    // Atualiza os dados de um produto existente
    async update(id, updateData) { throw new Error('Method not implemented'); }
}