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
            tls: {
                rejectUnauthorized: false
            }
        });
    }

    // Template base corporativo encapsulado para reaproveitamento e código limpo
    generateLayout(title, contentHtml) {
        return `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <style>
                    body {
                        background-color: #f4f6f8;
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        margin: 0;
                        padding: 0;
                        -webkit-font-smoothing: antialiased;
                    }
                    .email-wrapper {
                        width: 100%;
                        background-color: #f4f6f8;
                        padding: 40px 0;
                    }
                    .email-content {
                        max-width: 600px;
                        margin: 0 auto;
                        background-color: #ffffff;
                        border-radius: 8px;
                        overflow: hidden;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                        border: 1px solid #e5e7eb;
                    }
                    .email-header {
                        background-color: #1f2937;
                        color: #ffffff;
                        padding: 24px;
                        text-align: center;
                    }
                    .email-header h1 {
                        margin: 0;
                        font-size: 22px;
                        font-weight: 600;
                        letter-spacing: 0.5px;
                    }
                    .email-body {
                        padding: 32px 24px;
                        color: #374151;
                        font-size: 16px;
                        line-height: 1.6;
                    }
                    .btn {
                        display: inline-block;
                        background-color: #2563eb;
                        color: #ffffff !important;
                        text-decoration: none;
                        padding: 12px 24px;
                        border-radius: 6px;
                        font-weight: 600;
                        text-align: center;
                        margin: 20px 0;
                    }
                    .token-box {
                        background-color: #f3f4f6;
                        border: 1px dashed #d1d5db;
                        border-radius: 6px;
                        padding: 12px;
                        text-align: center;
                        font-family: monospace;
                        font-size: 20px;
                        font-weight: bold;
                        color: #111827;
                        letter-spacing: 2px;
                        margin: 16px 0;
                    }
                    .highlight-card {
                        background-color: #f8fafc;
                        border-left: 4px solid #2563eb;
                        padding: 16px;
                        margin: 20px 0;
                        border-radius: 0 6px 6px 0;
                    }
                    .email-footer {
                        background-color: #f9fafb;
                        padding: 16px 24px;
                        text-align: center;
                        color: #9ca3af;
                        font-size: 13px;
                        border-top: 1px solid #e5e7eb;
                    }
                </style>
            </head>
            <body>
                <div class="email-wrapper">
                    <div class="email-content">
                        <div class="email-header">
                            <h1>AutoShop ERP</h1>
                        </div>
                        <div class="email-body">
                            <h2 style="color: #111827; margin-top: 0; font-size: 20px;">${title}</h2>
                            ${contentHtml}
                        </div>
                        <div class="email-footer">
                            <p style="margin: 0;">Este é um e-mail automático enviado pelo sistema AutoShop ERP.
                                Por favor, não responda.
                            </p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    async sendPasswordResetEmail(toEmail, token) {
        const port = process.env.PORT || 4000;
        const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;
        const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;

        const content = `
            <p>Olá,</p>
            <p>Recebemos uma solicitação para redefinir a senha associada à sua conta no <strong>AutoShop ERP</strong>.</p>
            <p>Se você fez esta solicitação, utilize o token de segurança abaixo ou clique no botão para prosseguir:</p>
            
            <div class="token-box">${token}</div>
            
            <div style="text-align: center;">
                <a href="${resetUrl}" class="btn">Redefinir Minha Senha</a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 24px;">
                Este token de recuperação é válido por apenas <strong>15 minutos</strong>.
                Caso não tenha solicitado a alteração, ignore esta mensagem.
            </p>
        `;

        const mailOptions = {
            from: '"AutoShop ERP" <no-reply@autoshop.com>',
            to: toEmail,
            subject: 'Recuperação de Senha - AutoShop ERP',
            html: this.generateLayout('Recuperação de Senha', content)
        };

        return await this.transporter.sendMail(mailOptions);
    }

    async sendServiceOrderCompletedEmail(toEmail, orderCode, vehicle, totalAmount) {
        const formattedAmount = Number(totalAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        const content = `
            <p>Olá,</p>
            <p>Temos uma excelente notícia! A sua Ordem de Serviço foi concluída com sucesso em nossa oficina.</p>
            
            <div class="highlight-card">
                <p style="margin: 0 0 8px 0;"><strong>Código da O.S.:</strong> ${orderCode}</p>
                <p style="margin: 0 0 8px 0;"><strong>Veículo:</strong> ${vehicle}</p>
                <p style="margin: 0;"><strong>Valor Total:</strong>
                    <span style="color: #16a34a; font-weight: bold;">${formattedAmount}</span>
                </p>
            </div>

            <p>O seu veículo já está pronto para retirada. Agradecemos pela preferência e confiança em nossos serviços!</p>
        `;

        const mailOptions = {
            from: '"AutoShop ERP" <no-reply@autoshop.com>',
            to: toEmail,
            subject: `Ordem de Serviço ${orderCode} Concluída - AutoShop`,
            html: this.generateLayout('Veículo Pronto!', content)
        };

        return await this.transporter.sendMail(mailOptions);
    }
}