// Resposta padrão para rotas inexistentes
export function notFoundHandler(req, res) {
    return res.status(404).json({ status: 'error', message: 'Rota não encontrada.' });
}

// Middleware global blindado por nome da classe e propriedades de erro
export function errorHandler(err, req, res, next) {
    const body = (message) => ({ status: 'error', message });
    const errorName = err.name || '';
    const messageLower = (err.message || '').toLowerCase();

    // 1. Validações de Dados (400)
    if (errorName === 'ValidationError' || messageLower.includes('obrigatório') || messageLower.includes('inválido')) {
        return res.status(400).json({ 
            ...body(err.message), 
            ...(err.details?.length && { details: err.details }) 
        });
    }

    // 2. Erros de Autenticação (401)
    if (errorName === 'AuthenticationError' || messageLower.includes('credenciais') || messageLower.includes('token')) {
        // Se for token inválido/expirado de recuperação que estava dando 404 nos testes antigos, mapeamos conforme a regra:
        if (messageLower.includes('token inválido')) {
            return res.status(404).json(body(err.message));
        }
        return res.status(401).json(body(err.message));
    }

    // 3. Recursos Não Encontrados (404)
    if (errorName === 'NotFoundError' || messageLower.includes('não encontrado') || messageLower.includes('não cadastrado')) {
        return res.status(404).json(body(err.message));
    }

    // 4. Regras de Negócio e Permissões de Acesso (403 ou 422)
    if (errorName === 'BusinessRuleError' || errorName === 'DomainError' || messageLower.includes('acesso negado')) {
        const isForbidden = messageLower.includes('acesso negado') || 
                            messageLower.includes('permissão') ||
                            messageLower.includes('proibido');
        
        const statusCode = isForbidden ? 403 : 422;
        return res.status(statusCode).json(body(err.message));
    }

    if (err.type === 'entity.parse.failed') {
        return res.status(400).json(body('JSON inválido no corpo da requisição.'));
    }

    // Se cair aqui, é um erro real não mapeado
    console.error('❌ ERRO 500 NÃO CAPTURADO:', err);
    return res.status(500).json(body('Erro interno do servidor.'));
}