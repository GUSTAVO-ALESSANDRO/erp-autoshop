export class AuthController {
  constructor(loginUseCase) {
    // Injeção do caso de uso de login
    this.loginUseCase = loginUseCase;
  }

  // Trata a requisição HTTP de login e envia a resposta correspondente
  async login(req, res) {
    try {
      const { email, password } = req.body;
      
      // Executa o caso de uso de login
      const result = await this.loginUseCase.execute({ email, password });
      
      // Retorna sucesso HTTP 200 com os dados e o token
      return res.status(200).json(result);
    } catch (error) {
      // Retorna erro HTTP 401 caso ocorra falha na autenticação
      return res.status(401).json({
        status: 'error',
        message: error.message
      });
    }
  }
}