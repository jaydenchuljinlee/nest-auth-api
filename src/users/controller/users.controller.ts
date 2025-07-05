import { Body, Controller, Post } from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user.dto';
import { UsersService } from '../service/users.service';


@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post('signup')
    async signup(@Body() createUserDto: CreateUserDto) {
        const user = await this.usersService.create(createUserDto);
        return { id: user.id, email: user.email };
    }
}
