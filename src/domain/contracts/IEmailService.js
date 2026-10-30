// Contrato para o serviço externo de disparo de e-mails
export class IEmailService {
    // Envia e-mail transacional com token de recuperação de senha
    async sendPasswordResetEmail(toEmail, token) { throw new Error('Method not implemented'); }
    
    // Envia notificação por e-mail informando a conclusão da Ordem de Serviço
    async sendServiceOrderCompletedEmail(toEmail, orderCode, vehicle, totalAmount) { throw new Error('Method not implemented'); }
}