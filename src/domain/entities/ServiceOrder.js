export class ServiceOrder {
    constructor({
        id,
        code,
        customer_id,
        vehicle_brand,
        vehicle_model,
        vehicle_year,
        vehicle_fipe_code,
        title,
        description,
        status = 'ORCAMENTO',
        labor_cost = 0,
        discount = 0,
        total_amount = 0,
        created_at,
        items = [],
        employees = []
    }) {
        this.id = id;
        this.code = code;
        this.customer_id = customer_id;
        this.vehicle_brand = vehicle_brand;
        this.vehicle_model = vehicle_model;
        this.vehicle_year = vehicle_year;
        this.vehicle_fipe_code = vehicle_fipe_code;
        this.title = title;
        this.description = description;
        this.status = status;
        this.labor_cost = Number(labor_cost) || 0;
        this.discount = Number(discount) || 0;
        this.total_amount = Number(total_amount) || 0;
        this.created_at = created_at;
        this.items = items;
        this.employees = employees;
    }
}