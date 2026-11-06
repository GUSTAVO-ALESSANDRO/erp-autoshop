// Contrato para o repositório de usuários, isolando a regra de negócio do banco de dados
export class IUserRepository {
    // Busca um usuário pelo e-mail cadastrado
    async findByEmail(_email) { throw new Error('Method not implemented'); }

    // Busca um usuário pelo ID único
    async findById(_id) { throw new Error('Method not implemented'); }
    
    // Persiste e cadastra um novo usuário no sistema
    async create(_userEntity) { throw new Error('Method not implemented'); }
    
    // Retorna a listagem completa de usuários
    async findAll() { throw new Error('Method not implemented'); }
    
    // Atualiza os dados cadastrais do usuário
    async update(_id, _updateData) { throw new Error('Method not implemented'); }
    
    // Remove o usuário do sistema
    async delete(_id) { throw new Error('Method not implemented'); }
    
    // Atualiza o token temporário de redefinição de senha
    async updateResetToken(_email, _token, _expiresAt) { throw new Error('Method not implemented'); }
    
    // Busca usuário por token de recuperação válido e não expirado
    async findByResetToken(_token) { throw new Error('Method not implemented'); }
    
    // Atualiza a senha e limpa o token de recuperação do usuário
    async updatePasswordAndClearToken(_userId, _newPasswordHash) { throw new Error('Method not implemented'); }
}