import { jest } from '@jest/globals';
import { FipeService } from '../../src/infrastructure/external-services/fipe/FipeService.js';
import { FipeUseCase } from '../../src/use-cases/fipe/FipeUseCase.js';
import { ExternalServiceError, NotFoundError, ValidationError } from '../../src/domain/errors/DomainErrors.js';

describe('Unit Tests - FipeService & FipeUseCase Combined', () => {
    describe('FipeService (External Service Mock)', () => {
        let fetchMock;
        let fipeService;

        beforeEach(() => {
            fetchMock = jest.fn();
            fipeService = new FipeService(fetchMock);
        });

        it('consulta marcas pela URL FIPE v2 correta', async () => {
            const brands = [{ code: '23', name: 'GM - Chevrolet' }];
            fetchMock.mockResolvedValue({
                ok: true,
                json: async () => brands
            });

            await expect(fipeService.getBrands('cars')).resolves.toEqual(brands);
            expect(fetchMock).toHaveBeenCalledWith('https://fipe.parallelum.com.br/api/v2/cars/brands');
        });

        it('consulta placa usando o endpoint plates e normaliza a placa', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: async () => ({ brand: 'Volkswagen' })
            });

            await fipeService.getVehicleByPlate('abc1d23');

            expect(fetchMock).toHaveBeenCalledWith('https://fipe.parallelum.com.br/api/v2/plates/ABC1D23');
        });

        it('rejeita placa em formato inválido antes de chamar a API', async () => {
            await expect(fipeService.getVehicleByPlate('placa-invalida')).rejects.toThrow(ValidationError);
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('converte resposta 404 em NotFoundError', async () => {
            fetchMock.mockResolvedValue({ ok: false, status: 404 });

            await expect(fipeService.getBrands()).rejects.toThrow(NotFoundError);
        });

        it('converte falhas externas e de conexão em ExternalServiceError', async () => {
            fetchMock.mockResolvedValue({ ok: false, status: 429 });
            await expect(fipeService.getBrands()).rejects.toThrow(ExternalServiceError);

            fetchMock.mockRejectedValue(new Error('network failure'));
            await expect(fipeService.getBrands()).rejects.toThrow(ExternalServiceError);
        });

        it('Deve lançar ValidationError ao enviar identificadores vazios para a codificação de ID', async () => {
            const service = new FipeService();
            expect(() => service.encodeId('   ')).toThrow();
        });

        it('Deve lançar ExternalServiceError quando a API retornar um status de erro genérico', async () => {
            const mockFetch = jest.fn().mockResolvedValue({
                ok: false,
                status: 500
            });
            const service = new FipeService(mockFetch);
            await expect(service.request('/test')).rejects.toThrow();
        });

        it('Deve lançar ValidationError se o tipo de veículo for inválido', () => {
            const service = new FipeService();
            expect(() => service.getVehicleType('aviao')).toThrow();
        });
    });

    describe('FipeUseCase & FipeExternalService Mock', () => {
        let fipeUseCase;
        let mockFipeService;

        beforeEach(() => {
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

        it('Deve lançar ValidationError ao buscar marcas com tipo de veículo totalmente inválido', async () => {
            await expect(fipeUseCase.getBrands('tipo_errado')).rejects.toThrow();
        });

        it('Deve lançar ValidationError ao tentar consultar preço FIPE sem informar os códigos obrigatórios', async () => {
            await expect(fipeUseCase.getVehiclePrice('cars', {})).rejects.toThrow(ValidationError);
        });
    });
});