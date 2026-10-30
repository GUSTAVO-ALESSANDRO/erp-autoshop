export class User {
    // Inicializa as propriedades essenciais da entidade de usuário
    constructor({
        id,
        name,
        email,
        passwordHash,
        role = 'CUSTOMER',
        isActive = true,
        createdAt = new Date(),
        resetPasswordToken = null,
        resetPasswordExpires = null
    }) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role; // 'CUSTOMER' | 'EMPLOYEE' | 'ADMIN'
        this.isActive = isActive;
        this.createdAt = createdAt;
        this.resetPasswordToken = resetPasswordToken;
        this.resetPasswordExpires = resetPasswordExpires;
    }

    // Verifica se o usuário possui perfil de administrador
    isAdmin() {
        return this.role === 'ADMIN';
    }

    // Verifica se o usuário possui perfil de funcionário
    isEmployee() {
        return this.role === 'EMPLOYEE';
    }

    // Verifica se o usuário possui perfil de cliente
    isCustomer() {
        return this.role === 'CUSTOMER';
    }
}