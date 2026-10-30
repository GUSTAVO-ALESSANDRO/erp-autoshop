import { pool } from '../database/connection.js';
import { ServiceOrder } from '../../domain/entities/ServiceOrder.js';
import { ServiceOrderItem } from '../../domain/entities/ServiceOrderItem.js';
import { ServiceOrderEmployee } from '../../domain/entities/ServiceOrderEmployee.js';
import { NotFoundError, InsufficientStockError } from '../../domain/errors/DomainErrors.js';

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

    // Obtém o próximo número sequencial da OS aplicando bloqueio consultivo (advisory lock)
    async getNextSequence(year, dbClient = pool) {
        await dbClient.query('SELECT pg_advisory_xact_lock($1, $2)', [51703, year]);
        const sequenceResult = await dbClient.query(
            `SELECT COALESCE(MAX(CAST(SPLIT_PART(code, '-', 3) AS INTEGER)), 0) AS max_sequence
             FROM service_orders
             WHERE code LIKE $1 AND SPLIT_PART(code, '-', 3) ~ '^[0-9]+$'`,
            [`OS-${year}-%`]
        );
        return Number(sequenceResult.rows[0].max_sequence) + 1;
    }

    // Executa a verificação de estoque com FOR UPDATE e realiza a baixa transacional
    async processStockDeduction(os, dbClient = pool) {
        const items = [...os.items].sort((left, right) => left.product_id.localeCompare(right.product_id));
        for (const item of items) {
            const prodRes = await dbClient.query(
                'SELECT current_stock FROM products WHERE id = $1 FOR UPDATE',
                [item.product_id]
            );
            if (!prodRes.rows[0]) {
                throw new NotFoundError(`Produto ${item.product_id} da Ordem de Serviço não encontrado.`);
            }

            const currentStock = Number(prodRes.rows[0].current_stock);
            if (currentStock < item.quantity) {
                throw new InsufficientStockError(
                    `Estoque insuficiente para o produto ID ${item.product_id}. Disponível: ${currentStock}, Necessário: ${item.quantity}`
                );
            }

            const balanceAfter = currentStock - item.quantity;
            await dbClient.query('UPDATE products SET current_stock = $1 WHERE id = $2', [balanceAfter, item.product_id]);
            await dbClient.query(
                `INSERT INTO stock_movements (id, product_id, type, quantity, balance_after, reason)
                 VALUES (gen_random_uuid(), $1, 'SAIDA', $2, $3, $4)`,
                [item.product_id, item.quantity, balanceAfter, `Uso na Ordem de Serviço ${os.code}`]
            );
        }
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

    // Retorna listagem otimizada de OS em lote utilizando agregação JSON do Postgres (Elimina problema de N+1 queries)
    async findAll({ status, customer_id } = {}) {
        let query = `
            SELECT 
                so.*,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', soi.id,
                            'os_id', soi.os_id,
                            'product_id', soi.product_id,
                            'quantity', soi.quantity,
                            'unit_cost_price', soi.unit_cost_price,
                            'unit_sell_price', soi.unit_sell_price,
                            'product_name', p.name
                        )
                    ) FILTER (WHERE soi.id IS NULL), '[]'
                ) as items_json
            FROM service_orders so
            LEFT JOIN service_order_items soi ON so.id = soi.os_id
            LEFT JOIN products p ON soi.product_id = p.id
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            query += ` AND so.status = $${params.length + 1}`;
            params.push(status);
        }
        if (customer_id) {
            query += ` AND so.customer_id = $${params.length + 1}`;
            params.push(customer_id);
        }

        query += ` GROUP BY so.id ORDER BY so.created_at DESC`;
        const res = await pool.query(query, params);
        
        return res.rows.map(row => {
            const os = this.toEntity(row);
            // Se a agregação retornar itens válidos, mapeia para entidades de itens
            if (row.items_json && Array.isArray(row.items_json) && row.items_json[0]?.id) {
                os.items = row.items_json.map(itemRow => new ServiceOrderItem(itemRow));
            } else {
                os.items = [];
            }
            return os;
        });
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