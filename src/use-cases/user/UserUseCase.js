import { randomUUID } from 'crypto';
import { User } from '../../domain/entities/User.js';
import { ValidationError, NotFoundError, BusinessRuleError } from '../../domain/errors/DomainErrors.js';
import { isUuid, validatePassword, validateMinName, validateEmail } from '../../domain/validators.js';

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

        // Validações rigorosas de domínio
        validateMinName(name, 'nome', 3);
        validateEmail(email);
        validatePassword(password);

        let assignedRole = 'CUSTOMER';

        if (requesterUser) {
            if (requesterUser.isAdmin()) {
                assignedRole = role && ALLOWED_ROLES.includes(role) ? role : 'CUSTOMER';
            } else if (requesterUser.isEmployee()) {
                assignedRole = 'CUSTOMER';
            } else {
                assignedRole = 'CUSTOMER';
            }
        } else {
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

        // Cria a instância da Entidade de Domínio
        const userEntity = new User({
            id: userId,
            name,
            email,
            passwordHash,
            role: assignedRole,
            isActive: true
        });

        const createdUser = await this.userRepository.create(userEntity);
        return createdUser.toPublicJSON();
    }

    // Listagem de usuários com restrição por role
    async getAllUsers(requesterUser) {
        let users = [];
        if (requesterUser.isAdmin()) {
            users = await this.userRepository.findAll();
        } else if (requesterUser.isEmployee()) {
            const allUsers = await this.userRepository.findAll();
            users = allUsers.filter(user => user.role === 'CUSTOMER');
        } else {
            throw new BusinessRuleError('Acesso negado.');
        }

        // Retorna todos sanitizados
        return users.map(user => user.toPublicJSON());
    }

    // Busca por ID com validação
    async getUserById(id, requesterUser) {
        if (!id || !isUuid(id)) {
            throw new ValidationError('ID de usuário inválido.');
        }

        const isAdmin = requesterUser.isAdmin();
        const isEmployee = requesterUser.isEmployee();
        const isSelf = requesterUser.id === id;

        if (!isAdmin && !isEmployee && !isSelf) {
            throw new BusinessRuleError('Acesso negado. Você não tem permissão para visualizar usuários.');
        }

        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new NotFoundError('Usuário não encontrado.');
        }

        if (isEmployee && !isAdmin && !isSelf) {
            if (!user.isCustomer()) {
                throw new BusinessRuleError('Acesso negado. Você não tem permissão para visualizar este usuário.');
            }
        }

        return user.toPublicJSON();
    }

    // Atualização com regras
    async updateUser(id, updateData, requesterUser) {
        if (!id || !isUuid(id)) {
            throw new ValidationError('ID de usuário inválido.');
        }

        // Validações se houverem campos de nome ou email no update
        if (updateData.name !== undefined) {
            validateMinName(updateData.name, 'nome', 3);
        }
        if (updateData.email !== undefined) {
            validateEmail(updateData.email);
        }

        const isAdmin = requesterUser.isAdmin();
        const isEmployee = requesterUser.isEmployee();
        const isSelf = requesterUser.id === id;

        if (!isAdmin && !isEmployee && !isSelf) {
            throw new BusinessRuleError('Acesso negado para atualizar este usuário.');
        }

        const targetUser = await this.userRepository.findById(id);
        if (!targetUser) {
            throw new NotFoundError('Usuário não encontrado.');
        }

        if (updateData.role && updateData.role !== targetUser.role) {
            if (!isAdmin) {
                throw new BusinessRuleError('Acesso negado. Apenas administradores podem alterar o cargo.');
            }
        }

        if (isAdmin || isSelf) {
            if (!isAdmin && isSelf) delete updateData.role; 
            const updated = await this.userRepository.update(id, updateData);
            return updated.toPublicJSON();
        }

        if (isEmployee) {
            if (targetUser.isCustomer()) {
                delete updateData.role;
                const updated = await this.userRepository.update(id, updateData);
                return updated.toPublicJSON();
            }
        }

        throw new BusinessRuleError('Acesso negado para atualizar este usuário.');
    }

    // Exclusão com regras de segurança
    async deleteUser(id, requesterUser) {
        if (!id || !isUuid(id)) {
            throw new ValidationError('ID de usuário inválido.');
        }

        const isAdmin = requesterUser.isAdmin();
        const isEmployee = requesterUser.isEmployee();

        if (!isAdmin && !isEmployee) {
            throw new BusinessRuleError('Acesso negado para excluir este usuário.');
        }

        const targetUser = await this.userRepository.findById(id);
        if (!targetUser) {
            throw new NotFoundError('Usuário não encontrado.');
        }

        if (isAdmin) {
            return await this.userRepository.delete(id);
        }

        if (isEmployee) {
            if (targetUser.isCustomer()) {
                return await this.userRepository.delete(id);
            }
        }

        throw new BusinessRuleError('Acesso negado para excluir este usuário.');
    }
}