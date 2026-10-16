import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export class JwtTokenService {
    constructor() {
        // Chave secreta e tempo de expiração obtidos do ambiente ou valores padrão
        this.secret = process.env.JWT_SECRET || 'secret';
        this.expiresIn = process.env.JWT_EXPIRES_IN || '1d';
    }

    // Gera o hash seguro de uma senha em texto plano
    async hashPassword(password) {
        return await bcrypt.hash(password, 10);
    }

    // Compara uma senha fornecida com o hash salvo no banco
    async comparePassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }

    // Assina e gera um token JWT contendo o payload informado
    generateToken(payload) {
        return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
    }

    // Valida e decodifica um token JWT recebido
    verifyToken(token) {
        return jwt.verify(token, this.secret);
    }
}