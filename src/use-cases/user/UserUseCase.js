import { randomUUID } from 'crypto';
import { ValidationError, NotFoundError, BusinessRuleError } from '../../domain/errors/DomainErrors.js';
import { isUuid, validatePassword } from '../../domain/validators.js';

const ALLOWED_ROLES = ['CUSTOMER', 'EMPLOYEE', 'ADMIN'];

export class UserUseCase {
    constructor(userRepository, tokenService) {
        this.userRepository = userRepository;
        this.tokenService = tokenService;
    }

    // Criação de usuário com validação de papéis
    async createUser({ name, email, password, role }, requesterUser) {
        if (!name || !email || !password) {
            throw new ValidationError('Nome, e-mail e senha são obrigatórios.');
        }

        // Valida o tamanho e formato da senha através do validador de domínio
        validatePassword(password);

        let assignedRole = 'CUSTOMER';

        if (requesterUser) {
            if (requesterUser.role === 'ADMIN') {
                // Admin pode definir qualquer role válida
                assignedRole = role && ALLOWED_ROLES.includes(role) ? role : 'CUSTOMER';
            } else if (requesterUser.role === 'EMPLOYEE') {
                assignedRole = 'CUSTOMER';
            } else {
                // Funcionário e Customer só podem criar clientes
                assignedRole = 'CUSTOMER';
            }
        } else {
            // Cadastro público só cria CUSTOMER
            assignedRole = 'CUSTOMER';
        }

        if (!ALLOWED_ROLES.includes(assignedRole)) {
            throw new ValidationError('Papel (role) inválido. Deve ser CUSTOMER, EMPLOYEE ou ADMIN.');
        }

        const existingUser = await this.userRepository.findByEmail(email);
        if (existingUser) {
            throw new BusinessRuleError('Já existe um usuário cadastrado com este e-mail.');
        }

        const passwordHash = await this.tokenService.hashPassword(password);
        const userId = randomUUID();

        return await this.userRepository.create({
            id: userId,
            name,
            email,
            passwordHash,
            role: assignedRole,
            isActive: true
        });
    }

    // Listagem de usuários com restrição por role
    async getAllUsers(requesterUser) {
        if (requesterUser.role === 'ADMIN') {
            return await this.userRepository.findAll();
        }

        // Funcionário só pode listar clientes
        if (requesterUser.role === 'EMPLOYEE') {
            const allUsers = await this.userRepository.findAll();
            // Retorna apenas clientes
            return allUsers.filter(user => user.role === 'CUSTOMER');
        }

        throw new BusinessRuleError('Acesso negado.');
    }

    // Busca por ID com validação
    async getUserById(id, requesterUser) {
        if (!id || !isUuid(id)) {
            throw new ValidationError('ID de usuário inválido.');
        }

        const isAdmin = requesterUser.role === 'ADMIN';
        const isEmployee = requesterUser.role === 'EMPLOYEE';
        const isSelf = requesterUser.id === id;

        // Se não for Admin, nem Employee e nem for o próprio perfil, não tem permissão
        if (!isAdmin && !isEmployee && !isSelf) {
            throw new BusinessRuleError('Acesso negado. Você não tem permissão para visualizar usuários.');
        }

        // Busca o usuário no banco
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new NotFoundError('Usuário não encontrado.');
        }

        // Se for Employee, ele só pode ver se o alvo for CUSTOMER
        if (isEmployee && !isAdmin && !isSelf) {
            if (user.role !== 'CUSTOMER') {
                throw new BusinessRuleError('Acesso negado. Você não tem permissão para visualizar este usuário.');
            }
        }

        // Se passou por tudo, retorna o usuário
        return user;
    }

    // Atualização com regras
    async updateUser(id, updateData, requesterUser) {
        if (!id || !isUuid(id)) {
            throw new ValidationError('ID de usuário inválido.');
        }

        // Validação de permissão e escopo antes de consultar o banco
        const isAdmin = requesterUser.role === 'ADMIN';
        const isEmployee = requesterUser.role === 'EMPLOYEE';
        const isSelf = requesterUser.id === id;

        // Se não for admin, nem funcionário, nem ele próprio alterando a si mesmo, bloqueia imediatamente
        if (!isAdmin && !isEmployee && !isSelf) {
            throw new BusinessRuleError('Acesso negado para atualizar este usuário.');
        }

        // Busca o usuário no banco
        const targetUser = await this.userRepository.findById(id);
        if (!targetUser) {
            throw new NotFoundError('Usuário não encontrado.');
        }

        // Validações de alteração da role
        if (updateData.role && updateData.role !== targetUser.role) {
            if (!isAdmin) {
                throw new BusinessRuleError('Acesso negado. Apenas administradores podem alterar o cargo.');
            }
        }

        if (isAdmin || isSelf) {
            // Cliente ou funcionário comum não muda a própria role
            if (!isAdmin && isSelf) delete updateData.role; 
            return await this.userRepository.update(id, updateData);
        }

        if (isEmployee) {
            // Funcionário só pode atualizar dados de clientes, nunca de outros funcionários ou admins
            if (targetUser.role === 'CUSTOMER') {
                // Funcionário não altera roles
                delete updateData.role;
                return await this.userRepository.update(id, updateData);
            }
        }

        throw new BusinessRuleError('Acesso negado para atualizar este usuário.');
    }

    // Exclusão com regras de segurança
    async deleteUser(id, requesterUser) {
        if (!id || !isUuid(id)) {
            throw new ValidationError('ID de usuário inválido.');
        }

        // Validação de privilégios
        const isAdmin = requesterUser.role === 'ADMIN';
        const isEmployee = requesterUser.role === 'EMPLOYEE';

        if (!isAdmin && !isEmployee) {
            throw new BusinessRuleError('Acesso negado para excluir este usuário.');
        }

        // Busca o usuário alvo
        const targetUser = await this.userRepository.findById(id);
        if (!targetUser) {
            throw new NotFoundError('Usuário não encontrado.');
        }

        if (isAdmin) {
            return await this.userRepository.delete(id);
        }

        if (isEmployee) {
            // Funcionário só pode deletar clientes (CUSTOMER)
            if (targetUser.role === 'CUSTOMER') {
                return await this.userRepository.delete(id);
            }
        }

        throw new BusinessRuleError('Acesso negado para excluir este usuário.');
    }
}