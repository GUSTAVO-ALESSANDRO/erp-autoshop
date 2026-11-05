import { jest } from '@jest/globals';
import { FipeService } from '../../src/infrastructure/external-services/fipe/FipeService.js';
import { ExternalServiceError, NotFoundError, ValidationError } from '../../src/domain/errors/DomainErrors.js';

describe('FipeService', () => {
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
