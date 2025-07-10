import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../service/auth.service';
import { UsersService } from '../../users/service/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: Partial<Record<keyof UsersService, jest.Mock>>;
  let jwtService: Partial<Record<keyof JwtService, jest.Mock>>;
  let mockUser;

  beforeEach(async () => {
    mockUser = {
      id: 1,
      email: 'test@example.com',
      password: await bcrypt.hash('password123', 10), // 실제 해시된 비밀번호
    };
    
    usersService = {
      findByEmail: jest.fn(),
    };

    jwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
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
      const user = { id: 1, email: 'test@example.com' };
      
      // jwtService.sign을 호출할 때마다 각각 다른 값을 반환하도록 설정
      jwtService.sign!
        .mockReturnValueOnce('access-token')   // 첫 번째 호출: accessToken
        .mockReturnValueOnce('refresh-token'); // 두 번째 호출: refreshToken
  
      const result = await authService.login(user as any);
  
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
  
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(jwtService.sign).toHaveBeenNthCalledWith(1, { sub: user.id, email: user.email }, { expiresIn: '15m' });
      expect(jwtService.sign).toHaveBeenNthCalledWith(2, { sub: user.id, email: user.email }, { expiresIn: '7d' });
    });
  });  
});
