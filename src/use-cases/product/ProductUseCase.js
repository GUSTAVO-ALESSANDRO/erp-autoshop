import { randomUUID } from 'crypto';
import { Product } from '../../domain/entities/Product.js';
import { ValidationError, NotFoundError, BusinessRuleError } from '../../domain/errors/DomainErrors.js';
import { isUuid, validateMinNumber, validateMinName } from '../../domain/validators.js';

export class ProductUseCase {
    constructor(productRepository, requesterUser) {
        this.productRepository = productRepository;
        this.requesterUser = requesterUser;
    }

    // Criação de produtos
    async createProduct({ name, description = '', cost_price, sell_price, current_stock }, requesterUser) {
        if (!requesterUser || (requesterUser.isCustomer())) {
            throw new BusinessRuleError('Acesso negado. Apenas funcionários ou administradores podem cadastrar produtos.');
        }

        if (!name || cost_price === undefined || cost_price === null || current_stock === undefined || current_stock === null) {
            throw new ValidationError('Nome, preço de compra e quantidade em estoque são obrigatórios.');
        }

        // Se não mandar o preço de venda, ele será no mesmo valor do preço de compra
        if (typeof sell_price !== 'number' || isNaN(sell_price)) {
            sell_price = cost_price;
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
        return createdProduct.toPrivateJSON();
    }

    // Listagem de produtos com restrição por role
    async getAllProducts(requesterUser) {
        let products = [];
        const allProducts = await this.productRepository.findAll();

        if (requesterUser.isAdmin() || requesterUser.isEmployee()) {
            // Funcionários e Admins veem tudo
            return allProducts.map(product => product.toPrivateJSON());
        } else {
            //Clientes só veem produtos ativos sem o preço de custo (Logado ou não)
            products = allProducts.filter(product => product.is_active === true);
            return products.map(product => product.toPublicJSON());
        }
    }

    // Busca por ID com validação
    async getProductById(id, requesterUser) {
        if (!id || !isUuid(id)) {
            throw new ValidationError('ID de produto inválido.');
        }

        const product = await this.productRepository.findById(id);
        if (!product) {
            throw new NotFoundError('Produto não encontrado.');
        }

        if (requesterUser.isAdmin() || requesterUser.isEmployee()) {
            //retorna o produto correto
            return product.toPrivateJSON();
        } else {
            if (product.is_active == false) {
                throw new BusinessRuleError('Acesso negado. Você não tem permissão para visualizar este produto.');
            }
            //retorna o produto correto sem o preço de custo
            return product.toPublicJSON();
        }
    }

    // Atualização com restrição por role
    async updateProduct(id, updateData, requesterUser) {
        if (!id || !isUuid(id)) {
            throw new ValidationError('ID do produto inválido.');
        }

        // Proteção contra usuário não logado e verificação de role
        if (!requesterUser || (!requesterUser.isAdmin() && !requesterUser.isEmployee())) {
            throw new BusinessRuleError('Acesso negado. Você não tem permissão para alterar produtos.');
        }

        const targetProduct = await this.productRepository.findById(id);
        if (!targetProduct) {
            throw new NotFoundError('Produto não encontrado.');
        }

        // Valida e aplica regras apenas para os campos que foram enviados
        if (updateData.name !== undefined) {
            validateMinName(updateData.name, "nome do produto");
        }
        if (updateData.cost_price !== undefined) {
            validateMinNumber(updateData.cost_price, "preço de compra");
        }
        if (updateData.sell_price !== undefined) {
            validateMinNumber(updateData.sell_price, "preço de venda");
        }
        if (updateData.current_stock !== undefined) {
            validateMinNumber(updateData.current_stock, "quantidade em estoque");
        }

        const updated = await this.productRepository.update(id, updateData);
        
        // Retorna o dado alterado para os Admins ou Funcionarios
        return updated.toPrivateJSON();
    }

    // Exclusão lógica com restrição por role
    async deleteProduct(id, requesterUser) {
        if (!id || !isUuid(id)) {
            throw new ValidationError('ID de produto inválido.');
        }

        // Proteção contra usuário não logado e verificação de role
        if (!requesterUser || (!requesterUser.isAdmin() && !requesterUser.isEmployee())) {
            throw new BusinessRuleError('Acesso negado. Você não tem permissão para excluir produtos.');
        }

        const targetProduct = await this.productRepository.findById(id);
        if (!targetProduct) {
            throw new NotFoundError('Produto não encontrado.');
        }

        // Em vez de deletar fisicamente, atualizamos o is_active para false
        const updatedProduct = await this.productRepository.update(id, { is_active: false });

        // Retorna o produto atualizado
        return updatedProduct.toPrivateJSON();
    }
}