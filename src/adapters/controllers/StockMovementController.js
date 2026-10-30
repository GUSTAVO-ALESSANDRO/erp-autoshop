import { StockMovementPresenter } from '../presenters/StockMovementPresenter.js';

export class StockMovementController {
    constructor(stockMovementUseCase) {
        this.stockMovementUseCase = stockMovementUseCase;
    }

    // Trata requisição HTTP para criar movimentação de estoque
    async create(req, res, next) {
        try {
            const { id } = req.params;
            const movementData = req.body;
            const requesterUser = req.user;
            const result = await this.stockMovementUseCase.createStockMovement(id, movementData, requesterUser);
            return res.status(201).json({ status: 'success', data: StockMovementPresenter.toPublic(result) });
        } catch (error) {
            return next(error);
        }
    }

    // Trata listagem de movimentações por produto
    async getByProduct(req, res, next) {
        try {
            const { id } = req.params;
            const requesterUser = req.user;
            const movements = await this.stockMovementUseCase.getMovementsByProductId(id, requesterUser);
            return res.status(200).json({
                status: 'success',
                data: movements.map(StockMovementPresenter.toPublic)
            });
        } catch (error) {
            return next(error);
        }
    }

    // Trata listagem geral de movimentações
    async getAll(req, res, next) {
        try {
            const requesterUser = req.user;
            const movements = await this.stockMovementUseCase.getAllMovements(requesterUser);
            return res.status(200).json({
                status: 'success',
                data: movements.map(StockMovementPresenter.toPublic)
            });
        } catch (error) {
            return next(error);
        }
    }
}