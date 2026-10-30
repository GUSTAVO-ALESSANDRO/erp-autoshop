import { ValidationError, AuthenticationError } from '../../domain/errors/DomainErrors.js';

export class LoginUseCase {
  constructor(userRepository, tokenService) {
    // Injeção de dependências do repositório e do serviço de token
    this.userRepository = userRepository;
    this.tokenService = tokenService;
  }

  // Executa a lógica de autenticação do usuário
  async execute({ email, password }) {
    // Valida se os campos obrigatórios foram informados
    if (!email || !password) {
        throw new ValidationError('E-mail e senha são obrigatórios.');
    }

    // Busca o usuário no banco pelo e-mail fornecido e retorna a entidade User
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
        throw new AuthenticationError('Credenciais inválidas.');
    }

    // Valida se a conta do usuário está ativa
    if (user.isActive === false) {
        throw new AuthenticationError('Conta desativada.');
    }

    // Compara a senha informada utilizando o serviço de token injetado
    const isPasswordValid = await this.tokenService.comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
        throw new AuthenticationError('Credenciais inválidas.');
    }

    // Gera o token JWT contendo ID e papel (role) do usuário
    const token = this.tokenService.generateToken({
        id: user.id,
        role: user.role
    });

    // Retorna a entidade de usuário e o token; a camada HTTP aplica a apresentação pública
    return {
        user,
        token
    };
  }
}