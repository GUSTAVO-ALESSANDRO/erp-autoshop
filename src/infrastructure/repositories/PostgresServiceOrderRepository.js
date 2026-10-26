import { pool } from '../database/connection.js';
import { ServiceOrder } from '../../domain/entities/ServiceOrder.js';
import { ServiceOrderItem } from '../../domain/entities/ServiceOrderItem.js';
import { ServiceOrderEmployee } from '../../domain/entities/ServiceOrderEmployee.js';

export class PostgresServiceOrderRepository {
    // Insere a nova Ordem de Serviço no banco de dados
    async create(entity, dbClient = pool) {
        const query = `
            INSERT INTO service_orders (
                id, code, customer_id, vehicle_brand, vehicle_model, vehicle_year, 
                vehicle_fipe_code, title, description, status, labor_cost, discount, total_amount, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
            RETURNING *;
        `;
        const values = [
            entity.id, entity.code, entity.customer_id, entity.vehicle_brand,
            entity.vehicle_model, entity.vehicle_year, entity.vehicle_fipe_code,
            entity.title, entity.description, entity.status, entity.labor_cost,
            entity.discount, entity.total_amount
        ];
        const res = await dbClient.query(query, values);
        return this.toEntity(res.rows[0]);
    }

    // Busca a OS por ID recuperando também itens e funcionários via JOIN
    async findById(id, dbClient = pool, forUpdate = false) {
        const osQuery = `SELECT * FROM service_orders WHERE id = $1`;
        const lockedOsQuery = forUpdate ? `${osQuery} FOR UPDATE` : osQuery;
        const osRes = await dbClient.query(lockedOsQuery, [id]);
        if (!osRes.rows[0]) return null;

        const os = this.toEntity(osRes.rows[0]);

        // Carrega os itens associados com JOIN na tabela products
        const itemsQuery = `
            SELECT soi.*, p.name as product_name 
            FROM service_order_items soi
            JOIN products p ON soi.product_id = p.id
            WHERE soi.os_id = $1
        `;
        const itemsRes = await dbClient.query(itemsQuery, [id]);
        os.items = itemsRes.rows.map(row => new ServiceOrderItem(row));

        // Carrega os funcionários alocados na OS
        const empQuery = `
            SELECT soe.*, u.name as employee_name
            FROM service_order_employees soe
            JOIN users u ON soe.employee_id = u.id
            WHERE soe.os_id = $1
        `;
        const empRes = await dbClient.query(empQuery, [id]);
        os.employees = empRes.rows.map(row => new ServiceOrderEmployee(row));

        return os;
    }

    // Retorna listagem de OS com suporte a filtros opcionais
    async findAll({ status, customer_id } = {}) {
        let query = `SELECT * FROM service_orders WHERE 1=1`;
        const params = [];

        if (status) {
            query += ` AND status = $${params.length + 1}`;
            params.push(status);
        }
        if (customer_id) {
            query += ` AND customer_id = $${params.length + 1}`;
            params.push(customer_id);
        }

        query += ` ORDER BY created_at DESC`;
        const res = await pool.query(query, params);
        
        const orders = [];
        for (const row of res.rows) {
            const os = await this.findById(row.id);
            orders.push(os);
        }
        return orders;
    }

    // Adiciona um item congelando os preços unitários no momento da adição
    async addItem(osId, itemEntity, dbClient = pool) {
        const query = `
            INSERT INTO service_order_items (id, os_id, product_id, quantity, unit_cost_price, unit_sell_price)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `;
        const values = [
            itemEntity.id, osId, itemEntity.product_id, itemEntity.quantity,
            itemEntity.unit_cost_price, itemEntity.unit_sell_price
        ];
        const res = await dbClient.query(query, values);
        return new ServiceOrderItem(res.rows[0]);
    }

    // Vincula um funcionário/mecânico à Ordem de Serviço
    async addEmployee(osId, employeeId, dbClient = pool) {
        const query = `
            INSERT INTO service_order_employees (id, os_id, employee_id)
            VALUES (gen_random_uuid(), $1, $2)
            RETURNING *;
        `;
        const res = await dbClient.query(query, [osId, employeeId]);
        return new ServiceOrderEmployee(res.rows[0]);
    }

    // Atualiza o status da Ordem de Serviço
    async updateStatus(id, newStatus, dbClient = pool) {
        const query = `UPDATE service_orders SET status = $1 WHERE id = $2 RETURNING *`;
        const res = await dbClient.query(query, [newStatus, id]);
        return res.rows[0] ? this.toEntity(res.rows[0]) : null;
    }

    // Atualiza o valor total monetário da OS
    async updateTotalAmount(id, totalAmount, dbClient = pool) {
        const query = `UPDATE service_orders SET total_amount = $1 WHERE id = $2 RETURNING *`;
        const res = await dbClient.query(query, [totalAmount, id]);
        return res.rows[0] ? this.toEntity(res.rows[0]) : null;
    }

    // Mapeia registro bruto do banco para a entidade ServiceOrder
    toEntity(row) {
        return new ServiceOrder({
            id: row.id,
            code: row.code,
            customer_id: row.customer_id,
            vehicle_brand: row.vehicle_brand,
            vehicle_model: row.vehicle_model,
            vehicle_year: row.vehicle_year,
            vehicle_fipe_code: row.vehicle_fipe_code,
            title: row.title,
            description: row.description,
            status: row.status,
            labor_cost: row.labor_cost,
            discount: row.discount,
            total_amount: row.total_amount,
            created_at: row.created_at
        });
    }
}