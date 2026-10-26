import { ValidationError } from '../../domain/errors/DomainErrors.js';

const ALLOWED_VEHICLE_TYPES = ['cars', 'motorcycles', 'trucks'];

export class FipeUseCase {
    constructor(fipeExternalService) {
        this.fipeExternalService = fipeExternalService;
    }

    // Valida e normaliza o tipo de veículo
    validateType(vehicleType) {
        const type = vehicleType || 'cars';
        if (!ALLOWED_VEHICLE_TYPES.includes(type)) {
            throw new ValidationError('Tipo de veículo inválido. Use: cars, motorcycles ou trucks.');
        }
        return type;
    }

    async getVehicleByPlate(plate) {
        return await this.fipeExternalService.getVehicleByPlate(plate);
    }

    async getBrands(vehicleType) {
        const type = this.validateType(vehicleType);
        return await this.fipeExternalService.getBrands(type);
    }

    async getModels(vehicleType, brandId) {
        const type = this.validateType(vehicleType);
        if (!brandId) throw new ValidationError('O ID da marca é obrigatório.');
        return await this.fipeExternalService.getModels(type, brandId);
    }

    async getYears(vehicleType, brandId, modelId) {
        const type = this.validateType(vehicleType);
        if (!brandId || !modelId) throw new ValidationError('ID da marca e do modelo são obrigatórios.');
        return await this.fipeExternalService.getYears(type, brandId, modelId);
    }

    async getVehiclePrice(vehicleType, { brandId, modelId, yearId, fipeCode } = {}) {
        const type = this.validateType(vehicleType);
        
        if (fipeCode && yearId) {
            return await this.fipeExternalService.getPriceByFipeAndYear(type, fipeCode, yearId);
        }
        if (brandId && modelId && yearId) {
            return await this.fipeExternalService.getPriceByHierarchy(type, brandId, modelId, yearId);
        }
        
        throw new ValidationError('Parâmetros insuficientes para consultar o preço FIPE do veículo.');
    }
}