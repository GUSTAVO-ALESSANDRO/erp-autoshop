export class StockMovement {
    constructor({ id, product_id, type, quantity, balance_after, reason, created_at, product_name }) {
        this.id = id;
        this.product_id = product_id;
        this.type = type; // ENTRADA | SAIDA | AJUSTE
        this.quantity = Number(quantity) || 0;
        this.balance_after = Number(balance_after) || 0;
        this.reason = reason;
        this.created_at = created_at;
        this.product_name = product_name;
    }
}