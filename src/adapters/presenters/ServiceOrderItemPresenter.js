export class ServiceOrderItemPresenter {
    static toJSON(item) {
        if (!item) return null;
        return {
            id: item.id,
            os_id: item.os_id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_cost_price: item.unit_cost_price,
            unit_sell_price: item.unit_sell_price,
            product_name: item.product_name,
            total_price: item.quantity * item.unit_sell_price
        };
    }
}