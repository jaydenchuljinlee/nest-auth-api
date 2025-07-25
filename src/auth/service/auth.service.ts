import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../../users/service/users.service';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../users/entity/user.entity';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    return user;
  }

  async login(user: User) {
    const payload = { sub: user.id, email: user.email, roles: user.roles.map((r) => r.name), };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });


    return {
        accessToken,
        refreshToken,
    };    
  }

  async requestPasswordReset(email: string): Promise<string> {
    const verified = await this.redisService.get(`verify-done:${email}`);
    if (verified !== 'true') {
      throw new UnauthorizedException('이메일 인증이 필요합니다.');
    }
  
    const resetPasswordToken = uuidv4(); // 임시 비밀번호 재설정 토큰
    await this.redisService.set(`reset-password-token:${resetPasswordToken}`, email, 600); // 10분 동안 유효
  
    return resetPasswordToken;
  }

  async resetPassword(resetToken: string, newPassword: string): Promise<void> {
    const email = await this.redisService.get(`reset-password-token:${resetToken}`);
    if (!email) {
      throw new BadRequestException('유효하지 않거나 만료된 토큰입니다.');
    }
  
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
  
    await this.usersService.updatePassword(user.email, newPassword);
  
    await this.redisService.delete(`reset-password-token:${resetToken}`);
  }
  
  
}
