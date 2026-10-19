export class PasswordController {
    constructor(passwordRecoveryUseCase) {
        this.passwordRecoveryUseCase = passwordRecoveryUseCase;
    }

    // Solicita o envio do token de recuperação de senha por e-mail
    async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            const result = await this.passwordRecoveryUseCase.forgotPassword(email);
            return res.status(200).json({ status: 'success', ...result });
        } catch (error) {
            return res.status(400).json({ status: 'error', message: error.message });
        }
    }

    // Realiza a redefinição da senha utilizando o token válido
    async resetPassword(req, res) {
        try {
            const { token, newPassword } = req.body;
            const result = await this.passwordRecoveryUseCase.resetPassword(token, newPassword);
            return res.status(200).json({ status: 'success', ...result });
        } catch (error) {
            return res.status(400).json({ status: 'error', message: error.message });
        }
    }
}