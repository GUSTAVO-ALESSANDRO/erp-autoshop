import { jest } from '@jest/globals';
import { FipeUseCase } from '../../src/use-cases/fipe/FipeUseCase.js';
import { ValidationError, NotFoundError } from '../../src/domain/errors/DomainErrors.js';

describe('Unit Tests - FipeUseCase & FipeExternalService Mock', () => {
    let fipeUseCase;
    let mockFipeService;

    beforeEach(() => {
        // Mock do serviço externo de infraestrutura da FIPE
        mockFipeService = {
            getVehicleByPlate: jest.fn().mockImplementation(async (plate) => {
                if (plate === 'INVALIDO') throw new NotFoundError('Veículo não encontrado.');
                return { plate, brand: 'Volkswagen', model: 'SANTANA CG', year: '1986' };
            }),
            getBrands: jest.fn().mockResolvedValue([
                { code: '23', name: 'GM - Chevrolet' },
                { code: '25', name: 'Volkswagen' }
            ]),
            getModels: jest.fn().mockImplementation(async (type, brandId) => {
                if (brandId === '999') throw new NotFoundError('Marca não encontrada.');
                return { models: [{ code: '926', name: 'A-10 2.5/4.1' }] };
            }),
            getYears: jest.fn().mockResolvedValue([
                { code: '1985-1', name: '1985 Gasolina' }
            ]),
            getPriceByFipeAndYear: jest.fn().mockResolvedValue({
                price: 'R$ 8.276,00',
                brand: 'GM - Chevrolet',
                model: 'A-10 2.5/4.1',
                modelYear: 1985
            }),
            getPriceByHierarchy: jest.fn().mockResolvedValue({
                price: 'R$ 8.276,00',
                brand: 'GM - Chevrolet',
                model: 'A-10 2.5/4.1'
            })
        };

        fipeUseCase = new FipeUseCase(mockFipeService);
    });

    it('Deve consultar com sucesso um veículo válido pela placa', async () => {
        const result = await fipeUseCase.getVehicleByPlate('ABC1234');
        expect(result).toHaveProperty('plate', 'ABC1234');
        expect(result.brand).toBe('Volkswagen');
    });

    it('Deve lançar NotFoundError ao buscar placa inexistente', async () => {
        await expect(fipeUseCase.getVehicleByPlate('INVALIDO')).rejects.toThrow(NotFoundError);
    });

    it('Deve listar marcas de carros com sucesso', async () => {
        const brands = await fipeUseCase.getBrands('cars');
        expect(Array.isArray(brands)).toBe(true);
        expect(brands.length).toBe(2);
    });

    it('Deve lançar ValidationError ao informar tipo de veículo inválido', async () => {
        await expect(fipeUseCase.getBrands('avioes')).rejects.toThrow(ValidationError);
    });

    it('Deve listar modelos de uma marca específica', async () => {
        const models = await fipeUseCase.getModels('cars', '23');
        expect(models).toHaveProperty('models');
        expect(models.models[0].name).toBe('A-10 2.5/4.1');
    });

    it('Deve listar anos disponíveis para um modelo', async () => {
        const years = await fipeUseCase.getYears('cars', '23', '926');
        expect(Array.isArray(years)).toBe(true);
        expect(years[0].code).toBe('1985-1');
    });

    it('Deve obter o preço FIPE utilizando o código FIPE e o ano', async () => {
        const priceData = await fipeUseCase.getVehiclePrice('cars', { fipeCode: '004113-0', yearId: '1985-1' });
        expect(priceData).toHaveProperty('price', 'R$ 8.276,00');
    });

    it('Deve obter o preço FIPE utilizando a hierarquia completa (marca, modelo, ano)', async () => {
        const priceData = await fipeUseCase.getVehiclePrice('cars', { brandId: '23', modelId: '926', yearId: '1985-1' });
        expect(priceData).toHaveProperty('price', 'R$ 8.276,00');
    });

    it('Deve lançar ValidationError se faltarem parâmetros para consultar o preço', async () => {
        await expect(fipeUseCase.getVehiclePrice('cars', {})).rejects.toThrow(ValidationError);
    });
});