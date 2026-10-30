// Contrato para o serviço de consulta à API externa da Tabela FIPE
export class IFipeService {
    // Consulta dados do veículo utilizando a placa informada
    async getVehicleByPlate(plate) { throw new Error('Method not implemented'); }
    
    // Retorna as marcas de veículos disponíveis para o tipo especificado
    async getBrands(vehicleType) { throw new Error('Method not implemented'); }
    
    // Retorna os modelos vinculados a uma marca de veículo
    async getModels(vehicleType, brandId) { throw new Error('Method not implemented'); }
    
    // Retorna os anos correspondentes a um modelo de veículo
    async getYears(vehicleType, brandId, modelId) { throw new Error('Method not implemented'); }
    
    // Retorna o preço FIPE com base no código e ano ou na hierarquia de parâmetros
    async getPriceByFipeAndYear(vehicleType, fipeCode, yearId) { throw new Error('Method not implemented'); }
}