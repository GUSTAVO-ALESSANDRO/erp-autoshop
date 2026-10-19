export class UserController {
    constructor(userUseCase) {
        this.userUseCase = userUseCase;
    }

    // Trata a requisição HTTP POST para criação de usuários
    async create(req, res) {
        try {
            const { name, email, password, role } = req.body;
            const requesterUser = req.user;

            const user = await this.userUseCase.createUser({ name, email, password, role }, requesterUser);
            return res.status(201).json({ status: 'success', data: user });
        } catch (error) {
            return res.status(400).json({ status: 'error', message: error.message });
        }
    }

    // Trata a requisição GET para listar todos os usuários
    async getAll(req, res) {
        try {
            const requesterUser = req.user;
            const users = await this.userUseCase.getAllUsers(requesterUser);
            return res.status(200).json({ status: 'success', data: users });
        } catch (error) {
            const statusCode = error.message.includes('Acesso negado') ? 403 : 500;
            return res.status(statusCode).json({ status: 'error', message: error.message });
        }
    }

    // Trata a requisição GET para buscar um usuário por ID
    async getById(req, res) {
        try {
        const { id } = req.params;
        const requesterUser = req.user; // Usuário logado extraído do token pelo verifyToken

        const user = await this.userUseCase.getUserById(id, requesterUser);
            return res.status(200).json({ status: 'success', data: user });
        } catch (error) {
            // Retorna 403 se for erro de permissão ou 404 se não achar
            const statusCode = error.message.includes('Acesso negado') ? 403 : 404;
            return res.status(statusCode).json({ status: 'error', message: error.message });
        }
    }

    // Trata a requisição PUT para atualizar dados do usuário
    async update(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const requesterUser = req.user;
            const updatedUser = await this.userUseCase.updateUser(id, updateData, requesterUser);
            return res.status(200).json({ status: 'success', data: updatedUser });
        } catch (error) {
            const statusCode = error.message.includes('Acesso negado') || error.message.includes('permissão') ? 403 : 400;
            return res.status(statusCode).json({ status: 'error', message: error.message });
        }
    }

    // Trata a requisição DELETE para excluir um usuário
    async delete(req, res) {
        try {
            const { id } = req.params;
            const requesterUser = req.user;
            await this.userUseCase.deleteUser(id, requesterUser);
            return res.status(200).json({ status: 'success', message: 'Usuário excluído com sucesso.' });
        } catch (error) {
            const statusCode = error.message.includes('Acesso negado') ? 403 : 404;
            return res.status(statusCode).json({ status: 'error', message: error.message });
        }
    }
}