import { pool } from '../database/connection.js';

export class PostgresDashboardRepository {
    async getSummary() {
        const statusRes = await pool.query(`
            SELECT status, COUNT(*) as count 
            FROM service_orders 
            GROUP BY status
        `);
        
        const revenueRes = await pool.query(`
            SELECT 
                COALESCE(SUM(total_amount), 0) as total_revenue,
                COALESCE(SUM(labor_cost), 0) as total_labor_revenue
            FROM service_orders 
            WHERE status = 'CONCLUIDO'
        `);

        const customersRes = await pool.query(`
            SELECT COUNT(*) as total_customers 
            FROM users 
            WHERE role = 'CUSTOMER'
        `);

        const lowStockRes = await pool.query(`
            SELECT COUNT(*) as low_stock_count 
            FROM products 
            WHERE current_stock <= 5 AND is_active = true
        `);

        return {
            serviceOrdersByStatus: statusRes.rows,
            totalRevenue: Number(revenueRes.rows[0].total_revenue) || 0,
            totalLaborRevenue: Number(revenueRes.rows[0].total_labor_revenue) || 0,
            totalCustomers: Number(customersRes.rows[0].total_customers) || 0,
            lowStockCount: Number(lowStockRes.rows[0].low_stock_count) || 0
        };
    }

    // Retorna relatórios detalhados com cálculo seguro de métricas e filtros combinados
    async getFinancialMetrics({ start_date, end_date, employee_id, customer_id, product_id }) {
        let query = `
            SELECT 
                so.id, 
                so.code, 
                so.status, 
                so.total_amount as gross_revenue,
                so.labor_cost,
                so.discount,
                so.created_at
            FROM service_orders so
            WHERE so.status = 'CONCLUIDO'
        `;
        const params = [];

        if (start_date) {
            params.push(start_date);
            query += ` AND so.created_at >= $${params.length}`;
        }
        if (end_date) {
            params.push(end_date);
            query += ` AND so.created_at <= $${params.length}`;
        }
        if (customer_id) {
            params.push(customer_id);
            query += ` AND so.customer_id = $${params.length}`;
        }
        if (employee_id) {
            params.push(employee_id); // <-- CORREÇÃO: Adiciona ao array antes de usar params.length
            query += ` AND EXISTS (
                SELECT 1 FROM service_order_employees soe 
                WHERE soe.os_id = so.id AND soe.employee_id = $${params.length}
            )`;
        }
        if (product_id) {
            params.push(product_id); // <-- Já estava correto aqui
            query += ` AND EXISTS (
                SELECT 1 FROM service_order_items soi 
                WHERE soi.os_id = so.id AND soi.product_id = $${params.length}
            )`;
        }

        query += ` ORDER BY so.created_at DESC`;

        const res = await pool.query(query, params);
        
        const rows = res.rows.map(row => ({
            id: row.id,
            code: row.code,
            status: row.status,
            grossRevenue: Number(row.gross_revenue),
            laborCost: Number(row.labor_cost),
            discount: Number(row.discount),
            createdAt: row.created_at
        }));

        const totalGrossRevenue = rows.reduce((sum, r) => sum + r.grossRevenue, 0);

        return {
            summary: {
                totalOrders: rows.length,
                totalGrossRevenue
            },
            orders: rows
        };
    }
}

