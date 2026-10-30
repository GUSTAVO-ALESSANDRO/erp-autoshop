export class ProductPresenter {
    static toPrivate(product) {
        if (!product) return null;
        return {
            id: product.id,
            name: product.name,
            description: product.description,
            cost_price: product.cost_price,
            sell_price: product.sell_price,
            current_stock: product.current_stock,
            is_active: product.is_active,
            created_at: product.created_at
        };
    }

    static toPublic(product) {
        if (!product) return null;
        return {
            id: product.id,
            name: product.name,
            description: product.description,
            sell_price: product.sell_price,
            current_stock: product.current_stock,
            is_active: product.is_active,
            created_at: product.created_at
        };
    }
}