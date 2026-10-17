export class UserController {
    constructor(userUseCase) {
        this.userUseCase = userUseCase;
    }

    // Trata a requisição HTTP POST para criação de usuários
    async create(req, res) {
        try {
        const { name, email, password, role } = req.body;
        const requesterUser = req.user; // Obtido através do middleware verifyToken

        const user = await this.userUseCase.createUser({ name, email, password, role }, requesterUser);
            return res.status(201).json({ status: 'success', data: user });
        } catch (error) {
            return res.status(400).json({ status: 'error', message: error.message });
        }
    }

    // Trata a requisição GET para listar todos os usuários
    async getAll(req, res) {
        try {
        const users = await this.userUseCase.getAllUsers();
            return res.status(200).json({ status: 'success', data: users });
        } catch (error) {
            return res.status(500).json({ status: 'error', message: error.message });
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
        const updatedUser = await this.userUseCase.updateUser(id, updateData);
            return res.status(200).json({ status: 'success', data: updatedUser });
        } catch (error) {
            return res.status(400).json({ status: 'error', message: error.message });
        }
    }

    // Trata a requisição DELETE para excluir um usuário
    async delete(req, res) {
        try {
        const { id } = req.params;
        await this.userUseCase.deleteUser(id);
            return res.status(200).json({ status: 'success', message: 'Usuário excluído com sucesso.' });
        } catch (error) {
            return res.status(404).json({ status: 'error', message: error.message });
        }
    }
}