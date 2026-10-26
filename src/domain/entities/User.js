export class User {
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

    // verifica se o usuário é administrador
    isAdmin() {
        return this.role === 'ADMIN';
    }

    //verifica se o usuário é funcionário
    isEmployee() {
        return this.role === 'EMPLOYEE';
    }

    //verifica se o usuário é cliente
    isCustomer() {
        return this.role === 'CUSTOMER';
    }

    // Compara a senha informada com o hash armazenado de forma segura na entidade
    async comparePassword(password, tokenService) {
        return await tokenService.comparePassword(password, this.passwordHash);
    }

    // Limpa o objeto para uso externo, removendo dados sensíveis como hash de senha e tokens
    toPublicJSON() {
        return {
            id: this.id,
            name: this.name,
            email: this.email,
            role: this.role,
            isActive: this.isActive,
            createdAt: this.createdAt
        };
    }
}