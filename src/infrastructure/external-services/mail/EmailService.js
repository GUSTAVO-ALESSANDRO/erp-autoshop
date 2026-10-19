import nodemailer from 'nodemailer';

export class EmailService {
    constructor() {
        const port = Number(process.env.MAIL_PORT) || 2525;
        
        // Se a porta for 465, secure é true (SSL direto). Para 2525, secure é false (TLS/StartTLS)
        const isSecure = port === 465;

        this.transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST || 'smtp.mailtrap.io',
            port: port,
            secure: isSecure, 
            auth: {
                user: process.env.MAIL_USER || '',
                pass: process.env.MAIL_PASS || ''
            },
            // Opcional para evitar erros de certificado auto-assinado em alguns ambientes locais
            tls: {
                rejectUnauthorized: false
            }
        });
    }

    async sendPasswordResetEmail(toEmail, token) {
        const port = process.env.PORT || 4000;
        const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;
        const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;

        const mailOptions = {
            from: '"AutoShop ERP" <no-reply@autoshop.com>',
            to: toEmail,
            subject: 'Recuperação de Senha - AutoShop',
            html: `
                <h2>Recuperação de Senha</h2>
                <p>Você solicitou a redefinição da sua senha no sistema AutoShop.</p>
                <p>Utilize o token abaixo ou clique no link para prosseguir:</p>
                <h3>${token}</h3>
                <p><a href="${resetUrl}">Redefinir Senha</a></p>
                <p>Este token expira em 15 minutos.</p>
            `
        };

        return await this.transporter.sendMail(mailOptions);
    }
}