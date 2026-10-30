import { randomUUID } from 'crypto';
import { Product } from '../../domain/entities/Product.js';
import { ValidationError, NotFoundError, BusinessRuleError } from '../../domain/errors/DomainErrors.js';
import { isUuid, validateMinNumber, validateMinName } from '../../domain/validators.js';

export class ProductUseCase {
    // Construtor padronizado recebendo apenas o repositório baseado em contrato
    constructor(productRepository) {
        this.productRepository = productRepository;
    }

    // Criação de produtos com validação de perfil
    async createProduct({ name, description = '', cost_price, sell_price, current_stock }, requesterUser) {
        if (!requesterUser || requesterUser.isCustomer()) {
            throw new BusinessRuleError('Acesso negado. Apenas funcionários ou administradores podem cadastrar produtos.');
        }

        if (!name || cost_price === undefined || cost_price === null || current_stock === undefined || current_stock === null) {
            throw new ValidationError('Nome, preço de compra e quantidade em estoque são obrigatórios.');
        }

        // Se o preço de venda não foi informado, assume o preço de compra
        if (sell_price === undefined || sell_price === null) {
            sell_price = cost_price;
        } else if (typeof sell_price !== 'number' || isNaN(sell_price)) {
            throw new ValidationError('O preço de venda deve ser um número válido.');
        }

        validateMinNumber(sell_price, "preço de venda");
        validateMinNumber(cost_price, "preço de compra");
        validateMinNumber(current_stock, "quantidade em estoque");
        validateMinName(name, "nome");
        
        const productId = randomUUID();

        // Cria a instância da Entidade de Produto
        const productEntity = new Product({
            id: productId,
            name,
            description,
            cost_price,
            sell_price,
            current_stock,
            is_active: true
        });

        const createdProduct = await this.productRepository.create(productEntity);
        return createdProduct;
    }

    // Listagem de produtos com restrição por role e tratamento seguro para visitantes anônimos
    async getAllProducts(requesterUser) {
        const allProducts = await this.productRepository.findAll();

        if (!requesterUser) {
            return allProducts.filter(product => product.is_active === true);
        }

        if (requesterUser.isAdmin() || requesterUser.isEmployee()) {
            // Funcionários e Admins veem tudo (incluindo preço de custo e inativos)
            return allProducts;
        }

        // Clientes só veem produtos ativos sem o preço de custo
        return allProducts.filter(product => product.is_active === true);
    }

    // Busca por ID com validação de permissões e tratamento anônimo
    async getProductById(id, requesterUser) {
        if (!id || !isUuid(id)) {
            throw new ValidationError('ID de produto inválido.');
        }

        const product = await this.productRepository.findById(id);
        if (!product) {
            throw new NotFoundError('Produto não encontrado.');
        }

        if (!requesterUser) {
            if (product.is_active == false) {
                throw new BusinessRuleError('Acesso negado. Você não tem permissão para visualizar este produto.');
            }
            return product;
        }

        if (requesterUser.isAdmin() || requesterUser.isEmployee()) {
            return product;
        } else {
            if (product.is_active == false) {
                throw new BusinessRuleError('Acesso negado. Você não tem permissão para visualizar este produto.');
            }
            return product;
        }
    }

    // Atualização com restrição por role (Removido current_stock para forçar uso de StockMovements)
    async updateProduct(id, updateData, requesterUser) {
        if (!id || !isUuid(id)) {
            throw new ValidationError('ID do produto inválido.');
        }

        if (!requesterUser || (!requesterUser.isAdmin() && !requesterUser.isEmployee())) {
            throw new BusinessRuleError('Acesso negado. Você não tem permissão para alterar produtos.');
        }

        const targetProduct = await this.productRepository.findById(id);
        if (!targetProduct) {
            throw new NotFoundError('Produto não encontrado.');
        }

        if (Object.hasOwn(updateData, 'current_stock')) {
            throw new ValidationError('O estoque deve ser alterado por uma movimentação de estoque.');
        }

        if (updateData.name !== undefined) {
            validateMinName(updateData.name, "nome do produto");
        }
        if (updateData.cost_price !== undefined) {
            validateMinNumber(updateData.cost_price, "preço de compra");
        }
        if (updateData.sell_price !== undefined) {
            validateMinNumber(updateData.sell_price, "preço de venda");
        }

        const updated = await this.productRepository.update(id, updateData);
        return updated;
    }

    // Exclusão lógica com restrição por role
    async deleteProduct(id, requesterUser) {
        if (!id || !isUuid(id)) {
            throw new ValidationError('ID de produto inválido.');
        }

        if (!requesterUser || (!requesterUser.isAdmin() && !requesterUser.isEmployee())) {
            throw new BusinessRuleError('Acesso negado. Você não tem permissão para excluir produtos.');
        }

        const targetProduct = await this.productRepository.findById(id);
        if (!targetProduct) {
            throw new NotFoundError('Produto não encontrado.');
        }

        // Em vez de deletar fisicamente, atualizamos o is_active para false
        const updatedProduct = await this.productRepository.update(id, { is_active: false });
        return updatedProduct;
    }
}