// Erros de negócio tipados. Não conhecem HTTP: o errorHandler traduz cada classe em status code.
export class DomainError extends Error {
    constructor(message, details = []) {
        super(message);
        this.name = this.constructor.name;
        this.details = details;
    }
}
export class ValidationError extends DomainError {}  // 400
export class AuthenticationError extends DomainError {} // 401
export class NotFoundError extends DomainError {} // 404
export class BusinessRuleError extends DomainError {} // 422
export class InsufficientStockError extends BusinessRuleError {} // 422