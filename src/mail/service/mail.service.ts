import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { generateRandomCode } from '../../common/utis/generate-code';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class EmailService {
  private transporter;
  
  constructor(
    private readonly redisService: RedisService,
    private configService: ConfigService
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: true,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendVerificationEmail(to: string, code: string) {
    const mailOptions = {
      from: `"No Reply" <${this.configService.get('SMTP_USER')}>`,
      to,
      subject: '이메일 인증 코드',
      text: `인증 코드는 ${code}입니다.`,
    };

    return this.transporter.sendMail(mailOptions);
  }

  async sendVerificationCode(email: string) {
    const code = generateRandomCode();

    // Redis 저장 (5분간 유지)
    await this.redisService.set(`verify:${email}`, code, 300);

    // 메일 발송
    await this.sendVerificationEmail(email, code);
  }

  async verifyCode(email: string, code: string): Promise<void> {
    const storedCode = await this.redisService.get(`verify:${email}`);
  
    if (!storedCode || storedCode !== code) {
      throw new UnauthorizedException('인증 코드가 올바르지 않거나 만료되었습니다.');
    }
  
    // 인증 완료 플래그 저장 (옵션)
    await this.redisService.set(`verify-done:${email}`, 'true', 600); // 10분간 유지
  }  
}
