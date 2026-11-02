import { pool } from '../database/connection.js';

export class PostgresDashboardRepository {
    async getSummary() {
        // Contagem de usuários ativos e inativos agrupados por role
        const usersRes = await pool.query(`
            SELECT 
                role,
                COUNT(*) FILTER (WHERE is_active = true) as active_count,
                COUNT(*) FILTER (WHERE is_active = false) as inactive_count,
                COUNT(*) as total_count
            FROM users
            GROUP BY role
        `);

        let activeCustomers = 0, inactiveCustomers = 0;
        let activeEmployees = 0, inactiveEmployees = 0;
        let activeAdmins = 0, inactiveAdmins = 0;

        for (const row of usersRes.rows) {
            const active = Number(row.active_count) || 0;
            const inactive = Number(row.inactive_count) || 0;

            if (row.role === 'CUSTOMER') {
                activeCustomers = active;
                inactiveCustomers = inactive;
            } else if (row.role === 'EMPLOYEE') {
                activeEmployees = active;
                inactiveEmployees = inactive;
            } else if (row.role === 'ADMIN') {
                activeAdmins = active;
                inactiveAdmins = inactive;
            }
        }

        const totalActive = activeCustomers + activeEmployees + activeAdmins;
        const totalInactive = inactiveCustomers + inactiveEmployees + inactiveAdmins;
        const totalUsers = totalActive + totalInactive;

        // Produtos cadastrados e estoque detalhado de cada um
        const productsRes = await pool.query(`
            SELECT id, name, current_stock 
            FROM products 
            WHERE is_active = true
            ORDER BY name ASC
        `);

        // Quantidade total de Ordens de Serviço e contagem detalhada por status
        const osRes = await pool.query(`
            SELECT status, COUNT(*) as count 
            FROM service_orders 
            GROUP BY status
        `);

        const byStatus = {
            ORCAMENTO: 0,
            APROVADO: 0,
            EM_EXECUCAO: 0,
            CONCLUIDO: 0,
            CANCELADO: 0
        };

        let totalServiceOrders = 0;
        for (const row of osRes.rows) {
            const count = Number(row.count) || 0;
            if (byStatus[row.status] !== undefined) {
                byStatus[row.status] = count;
            }
            totalServiceOrders += count;
        }

        return {
            users: {
                active: {
                    total: totalActive,
                    customers: activeCustomers,
                    employees: activeEmployees,
                    admins: activeAdmins
                },
                inactive: {
                    total: totalInactive,
                    customers: inactiveCustomers,
                    employees: inactiveEmployees,
                    admins: inactiveAdmins
                },
                total: totalUsers
            },
            products: {
                totalCount: productsRes.rows.length,
                stockDetails: productsRes.rows.map(p => ({
                    id: p.id,
                    name: p.name,
                    current_stock: Number(p.current_stock) || 0
                }))
            },
            serviceOrders: {
                totalCount: totalServiceOrders,
                byStatus
            }
        };
    }

    // Retorna relatórios financeiros simplificados sem filtros
    async getFinancialMetrics() {
        // Dinheiro bruto total (soma do total_amount de todas as OS concluídas) e mão de obra
        const revenueRes = await pool.query(`
            SELECT 
                COALESCE(SUM(total_amount), 0) as gross_revenue,
                COALESCE(SUM(labor_cost), 0) as labor_revenue
            FROM service_orders 
            WHERE status = 'CONCLUIDO'
        `);

        const grossRevenue = Number(revenueRes.rows[0].gross_revenue) || 0;
        const laborRevenue = Number(revenueRes.rows[0].labor_revenue) || 0;

        // Dinheiro guardado em estoque de produtos (soma de current_stock * cost_price dos produtos ativos)
        const stockRes = await pool.query(`
            SELECT COALESCE(SUM(current_stock * cost_price), 0) as total_stock_value
            FROM products
            WHERE is_active = true
        `);
        const totalStockValue = Number(stockRes.rows[0].total_stock_value) || 0;

        return {
            grossRevenue,
            laborRevenue,
            totalStockValue
        };
    }
}