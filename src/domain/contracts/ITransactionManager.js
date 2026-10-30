// Contrato para gerenciamento de transações atômicas
export class ITransactionManager {
    // Executa uma função de callback dentro de uma transação isolada
    async transaction(callback) { throw new Error('Method not implemented'); }
}