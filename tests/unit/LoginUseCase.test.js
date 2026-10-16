import { jest } from '@jest/globals';
import { LoginUseCase } from '../../src/use-cases/auth/LoginUseCase.js';

describe('LoginUseCase', () => {
  // Testa o fluxo de sucesso ao realizar o login
  it('Deve autenticar com sucesso e retornar o token', async () => {
    // Cria um mock simulando o repositório de usuários
    const mockUserRepository = {
      findByEmail: jest.fn().mockResolvedValue({
        id: '1',
        name: 'Admin',
        email: 'admin@autocare.com',
        password_hash: 'hashed_password',
        role: 'ADMIN'
      })
    };

    // Cria um mock simulando o serviço de criptografia/token
    const mockTokenService = {
      comparePassword: jest.fn().mockResolvedValue(true),
      generateToken: jest.fn().mockReturnValue('mocked_jwt_token')
    };

    const loginUseCase = new LoginUseCase(mockUserRepository, mockTokenService);

    // Executa a função de login com credenciais válidas
    const result = await loginUseCase.execute({
      email: 'admin@autocare.com',
      password: 'password123'
    });

    // Valida se o token retornado corresponde ao esperado
    expect(result).toHaveProperty('token', 'mocked_jwt_token');
    expect(result.user.email).toBe('admin@autocare.com');
  });
});