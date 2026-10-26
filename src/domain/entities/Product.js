export class Product {
    constructor({
        id,
        name,
        description,
        cost_price,
        sell_price,
        current_stock,
        is_active,
        created_at
    }) {
        this.id = id;
        this.name = name;
        this.description = description;
        // Restringe para o retorno ser estritamente um numero
        this.cost_price = (cost_price !== null && cost_price !== undefined) ? parseFloat(cost_price) : 0;
        this.sell_price = (sell_price !== null && sell_price !== undefined) ? parseFloat(sell_price) : 0;
        this.current_stock = (current_stock !== null && current_stock !== undefined) ? Number(current_stock) : 0;
        this.is_active = is_active;
        this.created_at = created_at;
    }

    // Visão completa, apenas Admin e Funcionário
    toPrivateJSON() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            cost_price: this.cost_price,
            sell_price: this.sell_price,
            current_stock: this.current_stock,
            is_active: this.is_active,
            created_at: this.created_at
        };
    }

    // Visão do Cliente, mostra tudo sem o preço de custo
    toPublicJSON() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            sell_price: this.sell_price,
            current_stock: this.current_stock,
            is_active: this.is_active,
            created_at: this.created_at
        };
    }
}