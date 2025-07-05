import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../entity/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

const mockUserRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository, // ✅ 여기서 객체 자체를 주입
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  beforeEach(() => {
    // 테스트마다 mock 초기화
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createUserDto = { email: 'test@example.com', password: 'pass1234' };

    it('should throw ConflictException if email exists', async () => {
      mockUserRepository.findOne.mockResolvedValue({ email: createUserDto.email });

      await expect(service.create(createUserDto)).rejects.toThrow('이미 존재하는 이메일입니다.');
    });

    it('should save user with hashed password', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockImplementation((dto) => dto);
      mockUserRepository.save.mockImplementation((user) => ({ id: 1, ...user }));

      const result = await service.create(createUserDto);

      expect(mockUserRepository.create).toBeCalled();
      expect(mockUserRepository.save).toBeCalled();
      expect(result.email).toBe(createUserDto.email);
      expect(await bcrypt.compare(createUserDto.password, result.password)).toBe(true);
    });
  });
});

