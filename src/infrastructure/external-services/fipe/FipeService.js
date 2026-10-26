import fetch from 'node-fetch';
import { ExternalServiceError, NotFoundError, ValidationError } from '../../../domain/errors/DomainErrors.js';

export class FipeService {
    constructor(fetchImplementation = fetch) {
        this.baseUrl = 'https://fipe.parallelum.com.br/api/v2';
        this.fetch = fetchImplementation;
    }

    async request(endpoint) {
        try {
            const response = await this.fetch(`${this.baseUrl}${endpoint}`);
            if (!response.ok) {
                if (response.status === 404) {
                    throw new NotFoundError('Registro não encontrado na API da Tabela FIPE.');
                }
                throw new ExternalServiceError(`Erro ao comunicar com a API FIPE (Status: ${response.status}).`);
            }
            return await response.json();
        } catch (error) {
            if (error instanceof NotFoundError || error instanceof ValidationError || error instanceof ExternalServiceError) {
                throw error;
            }
            throw new ExternalServiceError('Falha de conexão com o serviço externo da Tabela FIPE.');
        }
    }

    async getVehicleByPlate(plate) {
        if (typeof plate !== 'string' || !/^[A-Za-z]{3}[0-9][A-Za-z0-9][0-9]{2}$/.test(plate.trim())) {
            throw new ValidationError('A placa informada é inválida.');
        }
        return await this.request(`/plates/${encodeURIComponent(plate.trim().toUpperCase())}`);
    }

    async getBrands(vehicleType = 'cars') {
        return await this.request(`/${this.getVehicleType(vehicleType)}/brands`);
    }

    async getModels(vehicleType = 'cars', brandId) {
        return await this.request(`/${this.getVehicleType(vehicleType)}/brands/${this.encodeId(brandId)}/models`);
    }

    async getYears(vehicleType = 'cars', brandId, modelId) {
        return await this.request(`/${this.getVehicleType(vehicleType)}/brands/${this.encodeId(brandId)}/models/${this.encodeId(modelId)}/years`);
    }

    async getPriceByFipeAndYear(vehicleType = 'cars', fipeCode, yearId) {
        if (typeof fipeCode !== 'string' || !/^\d{6}-\d$/.test(fipeCode)) {
            throw new ValidationError('O código FIPE informado é inválido.');
        }
        return await this.request(`/${this.getVehicleType(vehicleType)}/${this.encodeId(fipeCode)}/years/${this.encodeId(yearId)}`);
    }

    async getPriceByHierarchy(vehicleType = 'cars', brandId, modelId, yearId) {
        return await this.request(`/${this.getVehicleType(vehicleType)}/brands/${this.encodeId(brandId)}/models/${this.encodeId(modelId)}/years/${this.encodeId(yearId)}`);
    }

    getVehicleType(vehicleType) {
        if (!['cars', 'motorcycles', 'trucks'].includes(vehicleType)) {
            throw new ValidationError('Tipo de veículo inválido. Use: cars, motorcycles ou trucks.');
        }
        return vehicleType;
    }

    encodeId(value) {
        if (typeof value !== 'string' || !value.trim()) {
            throw new ValidationError('Os identificadores enviados à API FIPE são obrigatórios.');
        }
        return encodeURIComponent(value.trim());
    }
}