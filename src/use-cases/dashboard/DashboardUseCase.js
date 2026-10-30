import { BusinessRuleError } from '../../domain/errors/DomainErrors.js';

export class DashboardUseCase {
    constructor(dashboardRepository) {
        this.dashboardRepository = dashboardRepository;
    }

    // Retorna resumo executivo restrito a administradores
    async getSummary(requesterUser) {
        if (!requesterUser || !requesterUser.isAdmin()) {
            throw new BusinessRuleError('Acesso negado. Apenas administradores podem acessar o dashboard.');
        }
        return await this.dashboardRepository.getSummary();
    }

    // Retorna métricas financeiras de lucro e faturamento filtradas
    async getFinancialMetrics(filters = {}, requesterUser) {
        if (!requesterUser || !requesterUser.isAdmin()) {
            throw new BusinessRuleError('Acesso negado. Apenas administradores podem acessar as métricas financeiras.');
        }
        return await this.dashboardRepository.getFinancialMetrics(filters);
    }
}