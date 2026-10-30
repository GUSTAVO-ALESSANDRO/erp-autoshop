export class DashboardController {
    constructor(dashboardUseCase) {
        this.dashboardUseCase = dashboardUseCase;
    }

    // Trata requisição HTTP para resumo do dashboard
    async getSummary(req, res, next) {
        try {
            const requesterUser = req.user;
            const summary = await this.dashboardUseCase.getSummary(requesterUser);
            return res.status(200).json({ status: 'success', data: summary });
        } catch (error) {
            return next(error);
        }
    }

    // Trata requisição HTTP para métricas financeiras
    async getFinancial(req, res, next) {
        try {
            const filters = req.query;
            const requesterUser = req.user;
            const metrics = await this.dashboardUseCase.getFinancialMetrics(filters, requesterUser);
            return res.status(200).json({ status: 'success', data: metrics });
        } catch (error) {
            return next(error);
        }
    }
}