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
        throw new Error('E-mail e senha são obrigatórios.');
    }

    // Busca o usuário no banco pelo e-mail fornecido
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
        throw new Error('Credenciais inválidas.');
    }

    // Compara a senha informada com o hash armazenado
    const isPasswordValid = await this.tokenService.comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
        throw new Error('Credenciais inválidas.');
    }

    // Gera o token JWT contendo ID e papel (role) do usuário
    const token = this.tokenService.generateToken({
        id: user.id,
        role: user.role
    });

    // Retorna os dados públicos do usuário e o token gerado
    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        },
        token
    };
  }
}