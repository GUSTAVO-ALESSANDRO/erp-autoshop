import { EmailService } from '../../src/infrastructure/external-services/mail/EmailService.js';

describe('Unit Tests - EmailService', () => {
    it('Deve instanciar o serviço de email corretamente e conter os métodos de envio', async () => {
        const emailService = new EmailService();
        expect(emailService).toHaveProperty('sendPasswordResetEmail');
        expect(emailService).toHaveProperty('sendServiceOrderCompletedEmail');
    });

});

describe('Unit Tests - EmailService (Branches e Envio)', () => {
    it('Deve instanciar corretamente com SSL ativado quando a porta for 465', () => {
        process.env.MAIL_PORT = '465';
        const emailService = new EmailService();
        expect(emailService.transporter).toBeDefined();
    });

    it('Deve instanciar corretamente com porta padrão TLS quando não informada', () => {
        delete process.env.MAIL_PORT;
        const emailService = new EmailService();
        expect(emailService.transporter).toBeDefined();
    });
});