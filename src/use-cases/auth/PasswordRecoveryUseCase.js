import crypto from 'crypto';

export class PasswordRecoveryUseCase {
    constructor(userRepository, emailService, tokenService) {
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.tokenService = tokenService;
    }

    // Solicita a recuperação gerando o token e enviando o e-mail
    async forgotPassword(email) {
        if (!email) {
            throw new Error('O e-mail é obrigatório.');
        }

        const user = await this.userRepository.findByEmail(email);
        
        // Altera a regra para retornar erro explícito caso o e-mail não exista
        if (!user) {
            throw new Error('E-mail não cadastrado no sistema.');
        }

        // Gera um token aleatório seguro e define expiração para 15 minutos
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

        await this.userRepository.updateResetToken(email, resetToken, expiresAt);
        await this.emailService.sendPasswordResetEmail(email, resetToken);

        return { message: 'As instruções de recuperação foram enviadas' };
    }

    // Executa a troca de senha utilizando o token válido
    async resetPassword(token, newPassword) {
        if (!token || !newPassword) {
            throw new Error('Token e nova senha são obrigatórios.');
        }

        const user = await this.userRepository.findByResetToken(token);
        if (!user) {
            throw new Error('Token inválido ou expirado.');
        }

        // Gera o hash da nova senha
        const newPasswordHash = await this.tokenService.hashPassword(newPassword);

        await this.userRepository.updatePasswordAndClearToken(user.id, newPasswordHash);

        return { message: 'Senha redefinida com sucesso.' };
    }
}