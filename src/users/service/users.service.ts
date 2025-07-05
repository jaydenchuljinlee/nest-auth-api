import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entity/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import * as bcrypt from 'bcrypt';


@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>
      ) {}
    
      async create(createUserDto: CreateUserDto): Promise<User> {
        const { email, password } = createUserDto;
    
        const existing = await this.usersRepository.findOne({ where: { email } });
        if (existing) {
          throw new ConflictException('이미 존재하는 이메일입니다.');
        }
    
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = this.usersRepository.create({ email, password: hashedPassword });
        return this.usersRepository.save(user);
      }
    
}
