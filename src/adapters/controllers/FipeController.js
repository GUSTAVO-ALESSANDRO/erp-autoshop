export class FipeController {
    constructor(fipeUseCase) {
        this.fipeUseCase = fipeUseCase;
    }

    async getByPlate(req, res, next) {
        try {
            const { plate } = req.params;
            const vehicle = await this.fipeUseCase.getVehicleByPlate(plate);
            return res.status(200).json({ status: 'success', data: vehicle });
        } catch (error) {
            return next(error);
        }
    }

    async getBrands(req, res, next) {
        try {
            const { type } = req.query; // ?type=cars ou motorcycles ou truck
            const brands = await this.fipeUseCase.getBrands(type);
            return res.status(200).json({ status: 'success', data: brands });
        } catch (error) {
            return next(error);
        }
    }

    async getModels(req, res, next) {
        try {
            const { type } = req.query;
            const { brandId } = req.params;
            const models = await this.fipeUseCase.getModels(type, brandId);
            return res.status(200).json({ status: 'success', data: models });
        } catch (error) {
            return next(error);
        }
    }

    async getYears(req, res, next) {
        try {
            const { type } = req.query;
            const { brandId, modelId } = req.params;
            const years = await this.fipeUseCase.getYears(type, brandId, modelId);
            return res.status(200).json({ status: 'success', data: years });
        } catch (error) {
            return next(error);
        }
    }

    async getPrice(req, res, next) {
        try {
            const { type } = req.query;
            const priceData = await this.fipeUseCase.getVehiclePrice(type, req.query);
            return res.status(200).json({ status: 'success', data: priceData });
        } catch (error) {
            return next(error);
        }
    }
}