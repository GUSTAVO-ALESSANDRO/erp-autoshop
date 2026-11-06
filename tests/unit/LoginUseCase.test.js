import { jest } from '@jest/globals';
import { LoginUseCase } from '../../src/use-cases/auth/LoginUseCase.js';
import { User } from '../../src/domain/entities/User.js';

describe('LoginUseCase', () => {
    // Testa o fluxo de sucesso ao realizar o login
    it('Deve autenticar com sucesso e retornar o token', async () => {
      // Cria um mock simulando o repositório de usuários retornando uma Entidade User real
      const mockUserRepository = {
        findByEmail: jest.fn().mockResolvedValue(new User({
          id: '1',
          name: 'Admin',
          email: 'admin@autocare.com',
          passwordHash: 'hashed_password',
          role: 'ADMIN'
        }))
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
    it('Deve lançar AuthenticationError se o usuário não for encontrado pelo e-mail', async () => {
        const mockUserRepository = {
            findByEmail: jest.fn().mockResolvedValue(null)
        };
        const mockTokenService = {
            comparePassword: jest.fn(),
            generateToken: jest.fn()
        };

        const loginUseCase = new LoginUseCase(mockUserRepository, mockTokenService);

        await expect(loginUseCase.execute({
            email: 'naoexiste@autocare.com',
            password: 'password123'
        })).rejects.toThrow();
    });

    it('Deve lançar AuthenticationError se a senha estiver incorreta', async () => {
        const mockUserRepository = {
            findByEmail: jest.fn().mockResolvedValue(new User({
                id: '1',
                name: 'Admin',
                email: 'admin@autocare.com',
                passwordHash: 'hashed_password',
                role: 'ADMIN'
            }))
        };
        const mockTokenService = {
            comparePassword: jest.fn().mockResolvedValue(false),
            generateToken: jest.fn()
        };

        const loginUseCase = new LoginUseCase(mockUserRepository, mockTokenService);

        await expect(loginUseCase.execute({
            email: 'admin@autocare.com',
            password: 'senhaerrada'
        })).rejects.toThrow();
    });
});