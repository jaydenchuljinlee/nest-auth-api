import { Body, Controller, Post, Get, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateUserDto } from '../dto/create-user.dto';
import { UsersService } from '../service/users.service';
import { User } from '../decorator/user.decorator';
import { Roles } from '../../auth/decorator/roles.decorator';
import { RolesGuard } from '../../auth/guard/roles.guard'


@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post('signup')
    async signup(@Body() createUserDto: CreateUserDto) {
        const user = await this.usersService.create(createUserDto);
        return { id: user.id, email: user.email };
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('me')
    async getProfile(@User() req) {
      const user = await this.usersService.findByEmail(req.email);
        return {
        id: user?.id,
        email: user?.email,
      };
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('admin')        // admin 역할만 허용
    @Get('admin')
    async getAdminResource() {
      return '관리자 전용 리소스';
    }
}
