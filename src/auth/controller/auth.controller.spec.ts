import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../controller/auth.controller';
import { AuthService } from '../service/auth.service';
import { UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { ResetPasswordRequestDto } from '../dto/reset-password-request.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';


describe('AuthController', () => {
  let controller: AuthController;
  let authService: Partial<Record<keyof AuthService, jest.Mock>>;

  beforeEach(async () => {
    authService = {
      validateUser: jest.fn(),
      login: jest.fn(),
      requestPasswordReset: jest.fn(),
      resetPassword: jest.fn(),
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

      const cookieMock = jest.fn();
      const res = { cookie: cookieMock } as unknown as Response;

      const result = await controller.login(loginDto, res);

      expect(cookieMock).toHaveBeenCalledWith(
        'refresh_token',
        tokens.refreshToken,
        expect.objectContaining({
          httpOnly: true,
          maxAge: expect.any(Number),
        }),
      );

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

  describe('requestReset', () => {
    const dto: ResetPasswordRequestDto = { email: 'user@example.com' };

    it('should return reset token', async () => {
      authService.requestPasswordReset!.mockResolvedValue('reset-token');

      const result = await controller.requestReset(dto);

      expect(result).toEqual({ resetPasswordToken: 'reset-token' });
    });

    it('should throw UnauthorizedException if not verified', async () => {
      authService.requestPasswordReset!.mockRejectedValue(new UnauthorizedException());

      await expect(controller.requestReset(dto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('resetPassword', () => {
    const dto: ResetPasswordDto = { email: 'user@example.com', resetToken: 'token', newPassword: 'newpass123' };

    it('should return success message', async () => {
      authService.resetPassword!.mockResolvedValue(undefined);

      const result = await controller.resetPassword(dto);

      expect(result).toEqual({ message: '비밀번호가 성공적으로 변경되었습니다.' });
    });

    it('should throw BadRequestException for invalid token', async () => {
      authService.resetPassword!.mockRejectedValue(new BadRequestException());

      await expect(controller.resetPassword(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException for invalid user', async () => {
      authService.resetPassword!.mockRejectedValue(new NotFoundException());

      await expect(controller.resetPassword(dto)).rejects.toThrow(NotFoundException);
    });
  });
});
