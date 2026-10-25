import { ValidationError } from './errors/DomainErrors.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Regex para validação de formato de e-mail
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Verifica o formato de UUID antes de consultar o banco, evita erro cru do pg com ID malformado
export const isUuid = (value) => typeof value === 'string' && UUID_REGEX.test(value);

// Regra de senha, 8 a 72 caracteres (72 é o limite do bcrypt)
export function validatePassword(password) {
    if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
        throw new ValidationError('A senha deve ter entre 8 e 72 caracteres.');
    }
}

// Valida se o número é maior ou igual ao mínimo 
export function validateMinNumber(value, fieldName, min = 0) {
    if (value === undefined || value === null || typeof value !== 'number' || isNaN(value) || value < min) {
        throw new ValidationError(`O valor do campo ${fieldName} deve ser maior ou igual a ${min}.`);
    }
}

// Valida se o nome tem a quantidade mínima de caracteres
export function validateMinName(value, fieldName = 'nome', min = 3) {
    if (!value || typeof value !== 'string' || value.trim().length < min) {
        throw new ValidationError(`O campo '${fieldName}' deve ter no mínimo ${min} caracteres.`);
    }
}

export function validateEmail(email) {
    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
        throw new ValidationError('O formato do e-mail é inválido.');
    }
}