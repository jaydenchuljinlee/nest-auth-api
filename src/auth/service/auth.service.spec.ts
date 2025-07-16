import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../service/auth.service';
import { UsersService } from '../../users/service/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: Partial<Record<keyof UsersService, jest.Mock>>;
  let jwtService: Partial<Record<keyof JwtService, jest.Mock>>;
  let redisService: Partial<Record<keyof RedisService, jest.Mock>>;
  let mockUser;

  beforeEach(async () => {
    mockUser = {
      id: 1,
      email: 'test@example.com',
      password: await bcrypt.hash('password123', 10),
      roles: [{ name: 'user' }],
    };

    usersService = {
      findByEmail: jest.fn(),
      updatePassword: jest.fn(),
    };

    jwtService = {
      sign: jest.fn(),
    };

    redisService = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('validateUser', () => {
    it('should return user if email and password match', async () => {
      usersService.findByEmail!.mockResolvedValue(mockUser);
      const result = await authService.validateUser('test@example.com', 'password123');
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      usersService.findByEmail!.mockResolvedValue(null);
      await expect(authService.validateUser('wrong@example.com', '1234')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      usersService.findByEmail!.mockResolvedValue(mockUser);
      await expect(authService.validateUser('test@example.com', 'wrongpass')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should return access and refresh tokens', async () => {
      jwtService.sign!
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = await authService.login(mockUser);

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(jwtService.sign).toHaveBeenNthCalledWith(1, { sub: mockUser.id, email: mockUser.email, roles: ['user'] }, { expiresIn: '15m' });
      expect(jwtService.sign).toHaveBeenNthCalledWith(2, { sub: mockUser.id, email: mockUser.email, roles: ['user'] }, { expiresIn: '7d' });
    });
  });

  describe('requestPasswordReset', () => {
    it('should return reset token if verified', async () => {
      redisService.get!.mockResolvedValue('true');
      redisService.set!.mockResolvedValue(undefined);

      const token = await authService.requestPasswordReset('test@example.com');
      expect(typeof token).toBe('string');
      expect(redisService.set).toHaveBeenCalledWith(expect.stringContaining('reset-password-token:'), 'test@example.com', 600);
    });

    it('should throw UnauthorizedException if not verified', async () => {
      redisService.get!.mockResolvedValue(null);
      await expect(authService.requestPasswordReset('test@example.com')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('resetPassword', () => {
    it('should reset password if token and user valid', async () => {
      redisService.get!.mockResolvedValue('test@example.com');
      usersService.findByEmail!.mockResolvedValue(mockUser);
      usersService.updatePassword!.mockResolvedValue(undefined);
      redisService.delete!.mockResolvedValue(undefined);

      await authService.resetPassword('token', 'newPass');
      expect(usersService.updatePassword).toHaveBeenCalledWith('test@example.com', 'newPass');
      expect(redisService.delete).toHaveBeenCalledWith('reset-password-token:token');
    });

    it('should throw BadRequestException if token is invalid', async () => {
      redisService.get!.mockResolvedValue(null);
      await expect(authService.resetPassword('invalid-token', 'newPass')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if user not found', async () => {
      redisService.get!.mockResolvedValue('test@example.com');
      usersService.findByEmail!.mockResolvedValue(null);
      await expect(authService.resetPassword('token', 'newPass')).rejects.toThrow(NotFoundException);
    });
  });
});
