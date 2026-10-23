export class AuthController {
  constructor(loginUseCase) {
    // Injeção do caso de uso de login
    this.loginUseCase = loginUseCase;
  }

  // Trata a requisição HTTP de login e envia a resposta correspondente
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      
      // Executa o caso de uso de login
      const result = await this.loginUseCase.execute({ email, password });
      
      // Retorna sucesso HTTP 200 com os dados e o token
      return res.status(200).json(result);
    } catch (error) {
      // Delega o erro para o errorHandler
      return next(error);
    }
  }
}