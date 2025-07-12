import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
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
}
