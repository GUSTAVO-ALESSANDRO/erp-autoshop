export class StockMovementPresenter {
    static toPublic(movement) {
        if (!movement) return null;
        return {
            id: movement.id,
            product_id: movement.product_id,
            type: movement.type,
            quantity: movement.quantity,
            balance_after: movement.balance_after,
            reason: movement.reason,
            created_at: movement.created_at,
            product_name: movement.product_name
        };
    }
}