import { JwtTokenService } from '../../security/JwtTokenService.js';
import { AuthenticationError } from '../../../domain/errors/DomainErrors.js';
import { User } from '../../../domain/entities/User.js';

const tokenService = new JwtTokenService();

// Middleware para interceptar rotas e validar o token JWT nas requisições
export function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;

    // Verifica se o cabeçalho Authorization foi enviado corretamente
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new AuthenticationError('Token de autenticação não fornecido ou formato inválido.'));
    }

    // Extrai apenas o token da string "Bearer <token>"
    const token = authHeader.split(' ')[1];

    try {
        // Valida o token e recupera os dados decodificados
        const decoded = tokenService.verifyToken(token);
        
        // Anexa a instância da Entidade User na requisição para ter acesso aos métodos de role
        req.user = new User(decoded);
        return next(); // Prossegue para o próximo middleware ou controller
    } catch (error) {
        // Repassa o erro para o errorHandler centralizado
        return next(new AuthenticationError('Token inválido ou expirado.'));
    }
}

// função que verifica a role se tiver token válido, se não tiver não trava (usa para cadastro)
export function optionalVerifyToken(req, res, next) {
    const authHeader = req.headers.authorization;

    // Se não houver token, apenas segue o fluxo
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        req.user = undefined;
        return next();
    }

    const token = authHeader.split(' ')[1];

    try {
        // Se houver token válido, anexa os dados
        const decoded = tokenService.verifyToken(token);
        req.user = new User(decoded);
    } catch (error) {
        // Se o token for inválido, pode ignorar para ter cadastro público
        req.user = undefined;
    }

    return next();
}