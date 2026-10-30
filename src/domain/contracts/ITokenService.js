// Contrato para serviços de criptografia e gerenciamento de tokens JWT
export class ITokenService {
    // Gera o hash seguro de uma senha em texto plano
    async hashPassword(password) { throw new Error('Method not implemented'); }
    
    // Compara uma senha informada com o hash salvo no banco de dados
    async comparePassword(password, hashedPassword) { throw new Error('Method not implemented'); }
    
    // Assina e gera um token JWT contendo o payload
    generateToken(payload) { throw new Error('Method not implemented'); }
    
    // Valida e decodifica um token JWT recebido
    verifyToken(token) { throw new Error('Method not implemented'); }
}