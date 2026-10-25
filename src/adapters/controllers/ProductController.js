export class ProductController {
    constructor(productUseCase) {
        this.productUseCase = productUseCase;
    }

    // Criação de produto
    async create(req, res, next) {
        try {
            const { name, description, cost_price, sell_price, current_stock } = req.body;
            const requesterUser = req.user;

            const product = await this.productUseCase.createProduct(
                { name, description, cost_price, sell_price, current_stock },
                requesterUser
            );
            return res.status(201).json({ status: 'success', data: product });
        } catch (error) {
            return next(error);
        }
    }

    // Listagem de produtos
    async getAll(req, res, next) {
        try {
            const requesterUser = req.user;
            const products = await this.productUseCase.getAllProducts(requesterUser);
            return res.status(200).json({ status: 'success', data: products });
        } catch (error) {
            return next(error);
        }
    }

    // Busca por ID
    async getById(req, res, next) {
        try {
            const { id } = req.params;
            const requesterUser = req.user;

            const product = await this.productUseCase.getProductById(id, requesterUser);
            return res.status(200).json({ status: 'success', data: product });
        } catch (error) {
            return next(error);
        }
    }

    // Atualização de produto
    async update(req, res, next) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const requesterUser = req.user;

            const updatedProduct = await this.productUseCase.updateProduct(id, updateData, requesterUser);
            return res.status(200).json({ status: 'success', data: updatedProduct });
        } catch (error) {
            return next(error);
        }
    }

    // Exclusão lógica de produto
    async delete(req, res, next) {
        try {
            const { id } = req.params;
            const requesterUser = req.user;

            const deletedProduct = await this.productUseCase.deleteProduct(id, requesterUser);
            return res.status(200).json({ status: 'success', message: 'Produto inativado com sucesso.', data: deletedProduct });
        } catch (error) {
            return next(error);
        }
    }
}