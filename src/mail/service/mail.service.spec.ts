import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from '../service/mail.service';
import { RedisService } from '../../redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { generateRandomCode } from '../../common/utis/generate-code';

// generateRandomCode를 mock (테스트의 예측 가능성 보장)
jest.mock('../../common/utis/generate-code', () => ({
  generateRandomCode: jest.fn(() => '123456'),
}));

describe('EmailService', () => {
  let service: EmailService;
  let redisService: Partial<Record<keyof RedisService, jest.Mock>>;
  let configService: Partial<Record<keyof ConfigService, jest.Mock>>;
  const sendMailMock = jest.fn();

  beforeEach(async () => {
    redisService = {
      set: jest.fn(),
      get: jest.fn(),
    };

    configService = {
      get: jest.fn((key: string) => {
        const map = {
          SMTP_HOST: 'smtp.test.com',
          SMTP_PORT: 465,
          SMTP_USER: 'test@test.com',
          SMTP_PASS: 'password',
        };
        return map[key];
      }),
    };

    // nodemailer.createTransport mock 설정
    jest.spyOn(nodemailer, 'createTransport').mockReturnValue({
      sendMail: sendMailMock,
    } as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: RedisService, useValue: redisService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendVerificationCode', () => {
    it('should generate code, store in Redis and send email', async () => {
      await service.sendVerificationCode('test@example.com');

      expect(redisService.set).toHaveBeenCalledWith(
        'verify:test@example.com',
        '123456',
        300,
      );

      expect(sendMailMock).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          text: expect.stringContaining('123456'),
        }),
      );
    });
  });

  describe('verifyCode', () => {
    it('should succeed if code matches', async () => {
      redisService.get!.mockResolvedValue('123456');

      await service.verifyCode('test@example.com', '123456');

      expect(redisService.set).toHaveBeenCalledWith(
        'verify-done:test@example.com',
        'true',
        600,
      );
    });

    it('should throw if code does not match', async () => {
      redisService.get!.mockResolvedValue('999999');

      await expect(
        service.verifyCode('test@example.com', 'wrongcode'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if code is missing', async () => {
      redisService.get!.mockResolvedValue(null);

      await expect(
        service.verifyCode('test@example.com', 'anycode'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
