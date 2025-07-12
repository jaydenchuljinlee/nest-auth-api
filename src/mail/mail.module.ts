import { Module } from '@nestjs/common';
import { EmailService } from './service/mail.service';
import { EmailController } from './controller/mail.controller';
import { RedisService } from '../redis/redis.service';

@Module({
  providers: [EmailService, RedisService],
  controllers: [EmailController],
})
export class MailModule {}
