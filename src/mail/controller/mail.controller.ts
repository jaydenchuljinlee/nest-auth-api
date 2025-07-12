import { Body, Controller, Post } from '@nestjs/common';
import { EmailService } from '../service/mail.service';
import { SendCodeDto } from '../dto/send-code.dto';

@Controller('auth/email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send-code')
  async sendCode(@Body() dto: SendCodeDto) {
    await this.emailService.sendVerificationCode(dto.email);
    return { message: '인증 코드가 이메일로 전송되었습니다.' };
  }
}
