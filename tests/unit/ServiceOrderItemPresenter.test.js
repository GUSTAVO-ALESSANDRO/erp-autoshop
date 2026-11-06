import { ServiceOrderItemPresenter } from '../../src/adapters/presenters/ServiceOrderItemPresenter.js';

describe('Unit Tests - ServiceOrderItemPresenter', () => {
    it('deve retornar null se o item for nulo ou indefinido no toPrivate', () => {
        expect(ServiceOrderItemPresenter.toPrivate(null)).toBeNull();
        expect(ServiceOrderItemPresenter.toPrivate(undefined)).toBeNull();
    });

    it('deve formatar corretamente o item no toPrivate', () => {
        const item = {
            id: '1', os_id: '2', product_id: '3', quantity: 2,
            unit_cost_price: 10, unit_sell_price: 20, product_name: 'Peça'
        };
        const result = ServiceOrderItemPresenter.toPrivate(item);
        expect(result).toHaveProperty('total_price', 40);
    });

    it('deve retornar null se o item for nulo ou indefinido no toPublic', () => {
        expect(ServiceOrderItemPresenter.toPublic(null)).toBeNull();
    });

    it('deve formatar corretamente o item no toPublic', () => {
        const item = {
            id: '1', os_id: '2', product_id: '3', quantity: 2,
            unit_sell_price: 20, product_name: 'Peça'
        };
        const result = ServiceOrderItemPresenter.toPublic(item);
        expect(result).toHaveProperty('total_price', 40);
        expect(result).not.toHaveProperty('unit_cost_price');
    });
});