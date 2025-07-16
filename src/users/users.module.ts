import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './service/users.service';
import { UsersController } from './controller/users.controller';
import { User } from './entity/user.entity';
import { Role } from './entity/role.entity';


@Module({
  imports: [TypeOrmModule.forFeature([User, Role])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // (선택) 다른 모듈에서 쓰려면 export도 필요
})

export class UsersModule {}
