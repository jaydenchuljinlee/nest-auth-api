import { Module } from '@nestjs/common';
import { AuthService } from './service/auth.service';
import { AuthController } from './controller/auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';


@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      secret: 'secretKey', // 👉 나중에 .env로 분리하세요
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],

})
export class AuthModule {}
