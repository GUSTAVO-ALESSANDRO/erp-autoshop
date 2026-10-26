export class ServiceOrderItem {
    constructor({
        id,
        os_id,
        product_id,
        quantity,
        unit_cost_price,
        unit_sell_price,
        product_name
    }) {
        this.id = id;
        this.os_id = os_id;
        this.product_id = product_id;
        this.quantity = Number(quantity) || 0;
        this.unit_cost_price = Number(unit_cost_price) || 0;
        this.unit_sell_price = Number(unit_sell_price) || 0;
        this.product_name = product_name;
    }

    // Converte o item para JSON calculando o preço total da linha
    toJSON() {
        return {
            id: this.id,
            os_id: this.os_id,
            product_id: this.product_id,
            quantity: this.quantity,
            unit_cost_price: this.unit_cost_price,
            unit_sell_price: this.unit_sell_price,
            product_name: this.product_name,
            total_price: this.quantity * this.unit_sell_price
        };
    }
}