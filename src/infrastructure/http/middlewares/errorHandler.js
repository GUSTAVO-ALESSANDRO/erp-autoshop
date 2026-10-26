// Resposta padrão para rotas inexistentes
export function notFoundHandler(req, res) {
    return res.status(404).json({ status: 'error', message: 'Rota não encontrada.' });
}

// Middleware global blindado por nome da classe e propriedades de erro
export function errorHandler(err, req, res, next) {
    const body = (message) => ({ status: 'error', message });
    const errorName = err.name || '';
    const messageLower = (err.message || '').toLowerCase();

    // Erros de Autenticação (401 / 404 para token de recuperação)
    if (errorName === 'AuthenticationError' || messageLower.includes('credenciais') || messageLower.includes('token de autenticação')) {
        if (messageLower.includes('token inválido')) {
            return res.status(404).json(body(err.message));
        }
        return res.status(401).json(body(err.message));
    }

    // Validações de Dados (400)
    if (errorName === 'ValidationError' || messageLower.includes('obrigatório') || messageLower.includes('inválido')) {
        return res.status(400).json({ 
            ...body(err.message), 
            ...(err.details?.length && { details: err.details }) 
        });
    }

    // Recursos Não Encontrados (404)
    if (errorName === 'NotFoundError' || messageLower.includes('não encontrado') || messageLower.includes('não cadastrado')) {
        return res.status(404).json(body(err.message));
    }

    if (errorName === 'ExternalServiceError') {
        return res.status(502).json(body(err.message));
    }

    // Regras de Negócio e Permissões de Acesso (403 ou 422)
    if (errorName === 'BusinessRuleError' || errorName === 'InsufficientStockError' || errorName === 'DomainError' || messageLower.includes('acesso negado')) {
        const isForbidden = messageLower.includes('acesso negado') || 
                            messageLower.includes('permissão') ||
                            messageLower.includes('proibido');
        
        const statusCode = isForbidden ? 403 : 422;
        return res.status(statusCode).json(body(err.message));
    }

    if (err.type === 'entity.parse.failed') {
        return res.status(400).json(body('JSON inválido no corpo da requisição.'));
    }

    //Log do erro
    console.error('ERRO:', err);
    return res.status(500).json(body('Erro interno do servidor.'));
}