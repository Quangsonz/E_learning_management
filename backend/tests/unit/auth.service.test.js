const authService = require('../../src/services/auth.service');
const userRepository = require('../../src/repositories/user.repository');
const AppError = require('../../src/utils/appError');
const sendEmail = require('../../src/utils/email');

jest.mock('../../src/repositories/user.repository');
jest.mock('../../src/utils/email');
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mocked-token')
}));

describe('AuthService', () => {
  let mockRes;
  
  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should throw error if email or password missing', async () => {
      await expect(authService.login(null, 'pass', mockRes))
        .rejects.toThrow(AppError);
    });

    it('should throw error if user not found or wrong password', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      await expect(authService.login('test@test.com', 'wrong', mockRes))
        .rejects.toThrow('Email hoặc mật khẩu không chính xác');
    });

    it('should create and send token if credentials are valid', async () => {
      const mockUser = {
        _id: '123',
        password: 'hashedpassword',
        correctPassword: jest.fn().mockResolvedValue(true)
      };
      userRepository.findByEmail.mockResolvedValue(mockUser);

      await authService.login('test@test.com', 'password', mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        token: 'mocked-token',
        data: { user: mockUser }
      });
      expect(mockUser.password).toBeUndefined(); // Should clear password
    });
  });

  describe('register', () => {
    const reqUrl = { protocol: 'http', get: jest.fn().mockReturnValue('localhost') };
    const mockUserData = { name: 'Test', email: 'test@test.com', password: 'pass', role: 'student' };

    it('should throw error if email already exists', async () => {
      userRepository.findByEmail.mockResolvedValue({});
      await expect(authService.register(mockUserData, reqUrl, mockRes))
        .rejects.toThrow('Email đã được sử dụng!');
    });

    it('should create user, send email, and return token', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      
      const mockNewUser = {
        _id: '123',
        email: 'test@test.com',
        createEmailVerificationToken: jest.fn().mockReturnValue('verify-token'),
        save: jest.fn().mockResolvedValue(true)
      };
      
      userRepository.create.mockResolvedValue(mockNewUser);
      sendEmail.mockResolvedValue(true);

      await authService.register(mockUserData, reqUrl, mockRes);

      expect(userRepository.create).toHaveBeenCalledWith(mockUserData);
      expect(mockNewUser.createEmailVerificationToken).toHaveBeenCalled();
      expect(sendEmail).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        token: 'mocked-token'
      }));
    });
  });
});
