import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
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

      async findByEmail(email: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { email } });
      }

      async updatePassword(email: string, newPassword: string): Promise<void> {
        const user = await this.findByEmail(email);
        if (!user) {
          throw new NotFoundException('사용자를 찾을 수 없습니다.');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        
        await this.usersRepository.save(user);
      }
    
    
}
