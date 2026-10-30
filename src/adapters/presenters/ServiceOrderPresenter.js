import { ServiceOrderItemPresenter } from './ServiceOrderItemPresenter.js';
import { ServiceOrderEmployeePresenter } from './ServiceOrderEmployeePresenter.js';

export class ServiceOrderPresenter {
    static toPublic(order) {
        if (!order) return null;
        return {
            id: order.id,
            code: order.code,
            customer_id: order.customer_id,
            vehicle_brand: order.vehicle_brand,
            vehicle_model: order.vehicle_model,
            vehicle_year: order.vehicle_year,
            vehicle_fipe_code: order.vehicle_fipe_code,
            title: order.title,
            description: order.description,
            status: order.status,
            labor_cost: order.labor_cost,
            discount: order.discount,
            total_amount: order.total_amount,
            created_at: order.created_at,
            items: (order.items || []).map(item => ServiceOrderItemPresenter.toJSON(item)),
            employees: (order.employees || []).map(emp => ServiceOrderEmployeePresenter.toJSON(emp))
        };
    }
}