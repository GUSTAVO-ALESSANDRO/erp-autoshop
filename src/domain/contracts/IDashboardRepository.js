// Contrato de abstração para o repositório de métricas e relatórios do dashboard
export class IDashboardRepository {
    // Retorna o resumo geral de indicadores e status de OS
    async getSummary() { throw new Error('Method not implemented'); }
    
    // Retorna métricas financeiras detalhadas por intervalo de datas
    async getFinancialMetrics(filters) { throw new Error('Method not implemented'); }
}