import { Body, Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from '../service/auth.service';
import { LoginDto } from '../dto/login.dto';
import { ResetPasswordRequestDto } from '../dto/reset-password-request.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    const { accessToken, refreshToken } = await this.authService.login(user);
  
    // 👇 Set refresh token in HttpOnly cookie
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS 환경에서만 전송
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  
    return { accessToken };
  }
  
  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('refresh_token');
    return { message: 'Logged out' };
  }

  @Post('reset/request')
  async requestReset(@Body() dto: ResetPasswordRequestDto) {
    const resetPasswordToken = await this.authService.requestPasswordReset(dto.email);
    return { resetPasswordToken }; // 클라이언트가 비밀번호 변경 요청 시 이 토큰을 보냄
  }
}
