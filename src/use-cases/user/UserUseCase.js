import { randomUUID } from 'crypto';

export class UserUseCase {
    constructor(userRepository, tokenService) {
        this.userRepository = userRepository;
        this.tokenService = tokenService;
    }

    // Orquestra a criação de um novo usuário validando regras de negócio e hash
    async createUser({ name, email, password, role }, requesterUser) {
        if (!name || !email || !password) {
            throw new Error('Nome, e-mail e senha são obrigatórios.');
        }

        // Apenas Administradores autenticados podem definir cargos diferentes de CUSTOMER
        let assignedRole = 'CUSTOMER';
        if (role && requesterUser && requesterUser.role === 'ADMIN') {
            assignedRole = role; 
        }

        // Verifica se já existe um usuário cadastrado com o e-mail informado
        const existingUser = await this.userRepository.findByEmail(email);
        if (existingUser) {
            throw new Error('Já existe um usuário cadastrado com este e-mail.');
        }

        // Gera o hash seguro da senha informada
        const passwordHash = await this.tokenService.hashPassword(password);
        const userId = randomUUID();

        // Persiste o novo usuário utilizando is_active como true
        const newUser = await this.userRepository.create({
            id: userId,
            name,
            email,
            passwordHash,
            role: assignedRole,
            isActive: true
        });

        return newUser;
    }

    // Recupera a listagem completa de usuários do sistema
    async getAllUsers() {
        return await this.userRepository.findAll();
    }

    // Busca um usuário específico pelo ID validando sua existência
    async getUserById(id) {
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new Error('Usuário não encontrado.');
        }
        return user;
    }

    // Atualiza as informações cadastrais de um usuário
    async updateUser(id, updateData) {
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new Error('Usuário não encontrado.');
        }
        return await this.userRepository.update(id, updateData);
    }

    // Remove um usuário da base de dados por ID
    async deleteUser(id) {
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new Error('Usuário não encontrado.');
        }
        return await this.userRepository.delete(id);
    }
}