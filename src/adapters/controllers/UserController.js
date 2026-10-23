export class UserController {
    constructor(userUseCase) {
        this.userUseCase = userUseCase;
    }

    // Trata a requisição HTTP POST para criação de usuários
    async create(req, res, next) {
        try {
            const { name, email, password, role } = req.body;
            const requesterUser = req.user;

            const user = await this.userUseCase.createUser({ name, email, password, role }, requesterUser);
            return res.status(201).json({ status: 'success', data: user });
        } catch (error) {
            return next(error);
        }
    }

    // Trata a requisição GET para listar todos os usuários
    async getAll(req, res, next) {
        try {
            const requesterUser = req.user;
            const users = await this.userUseCase.getAllUsers(requesterUser);
            return res.status(200).json({ status: 'success', data: users });
        } catch (error) {
            return next(error);
        }
    }

    // Trata a requisição GET para buscar um usuário por ID
    async getById(req, res, next) {
        try {
            const { id } = req.params;
            
            // Usuário logado extraído do token pelo verifyToken
            const requesterUser = req.user;

            const user = await this.userUseCase.getUserById(id, requesterUser);
            return res.status(200).json({ status: 'success', data: user });
        } catch (error) {
            return next(error);
        }
    }

    // Trata a requisição PUT para atualizar dados do usuário
    async update(req, res, next) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const requesterUser = req.user;
            const updatedUser = await this.userUseCase.updateUser(id, updateData, requesterUser);
            return res.status(200).json({ status: 'success', data: updatedUser });
        } catch (error) {
            return next(error);
        }
    }

    // Trata a requisição DELETE para excluir um usuário
    async delete(req, res, next) {
        try {
            const { id } = req.params;
            const requesterUser = req.user;
            await this.userUseCase.deleteUser(id, requesterUser);
            return res.status(200).json({ status: 'success', message: 'Usuário excluído com sucesso.' });
        } catch (error) {
            return next(error);
        }
    }
}