import { Body, Controller, Post, Get, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateUserDto } from '../dto/create-user.dto';
import { UsersService } from '../service/users.service';
import { User } from '../decorator/user.decorator';


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
}
