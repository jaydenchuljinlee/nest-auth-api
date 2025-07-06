import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { User } from './users/entity/user.entity';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'myuser',
      password: 'mypassword',
      database: 'auth',
      entities: [User],
      synchronize: true,
    }),
    ConfigModule.forRoot({
      envFilePath: 'my.env',
      isGlobal: true,
    }),
    UsersModule,
    AuthModule,
  ],
})
export class AppModule {}
