import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../controller/auth.controller';
import { AuthService } from '../service/auth.service';
import { UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: Partial<Record<keyof AuthService, jest.Mock>>;

  beforeEach(async () => {
    authService = {
      validateUser: jest.fn(),
      login: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    const loginDto = { email: 'test@example.com', password: 'pass1234' };
    const user = { id: 1, email: loginDto.email };
    const tokens = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    };

    it('should return accessToken and set refreshToken cookie', async () => {
      authService.validateUser!.mockResolvedValue(user);
      authService.login!.mockResolvedValue(tokens);

      // mock Response with cookie function
      const cookieMock = jest.fn();
      const res = { cookie: cookieMock } as unknown as Response;

      const result = await controller.login(loginDto, res);

      // ✅ 쿠키 설정 확인
      expect(cookieMock).toHaveBeenCalledWith(
        'refresh_token',
        tokens.refreshToken,
        expect.objectContaining({
          httpOnly: true,
          maxAge: expect.any(Number),
        }),
      );

      // ✅ 반환값 확인
      expect(result).toEqual({ accessToken: tokens.accessToken });
    });

    it('should throw UnauthorizedException on failure', async () => {
      authService.validateUser!.mockRejectedValue(new UnauthorizedException());

      const res = { cookie: jest.fn() } as unknown as Response;

      await expect(controller.login(loginDto, res)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should clear refresh_token cookie and return message', async () => {
      const clearCookie = jest.fn();
      const res = { clearCookie } as unknown as Response;
  
      const result = await controller.logout(res);
  
      expect(clearCookie).toHaveBeenCalledWith('refresh_token');
      expect(result).toEqual({ message: 'Logged out' });
    });
  });
  
});
