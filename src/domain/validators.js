import { ValidationError } from './errors/DomainErrors.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Verifica o formato de UUID antes de consultar o banco, evita erro cru do pg com ID malformado
export const isUuid = (value) => typeof value === 'string' && UUID_REGEX.test(value);

// Regra de senha, 8 a 72 caracteres (72 é o limite do bcrypt)
export function validatePassword(password) {
    if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
        throw new ValidationError('A senha deve ter entre 8 e 72 caracteres.');
    }
}