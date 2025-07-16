import { Body, Controller, Post } from '@nestjs/common';
import { EmailService } from '../service/mail.service';
import { SendCodeDto } from '../dto/send-code.dto';
import { VerifyCodeDto } from '../dto/verify-code.dto';

@Controller('auth/email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send-code')
  async sendCode(@Body() dto: SendCodeDto) {
    await this.emailService.sendVerificationCode(dto.email);
    return { message: '인증 코드가 이메일로 전송되었습니다.' };
  }

  @Post('verify-code')
  async verifyCode(@Body() dto: VerifyCodeDto) {
    await this.emailService.verifyCode(dto.email, dto.code);
    return { message: '이메일 인증이 완료되었습니다.' };
  }
}
