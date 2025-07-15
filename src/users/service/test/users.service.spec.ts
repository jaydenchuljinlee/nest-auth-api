import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../entity/user.entity';
import * as bcrypt from 'bcrypt';
import { ConflictException, NotFoundException } from '@nestjs/common';

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

    it('should hash password and save user', async () => {
      const dto = { email: 'test@example.com', password: 'pass1234' };

      
      mockUserRepository.findOne!.mockResolvedValue(null);
      mockUserRepository.create!.mockImplementation((user) => user);
      mockUserRepository.save!.mockImplementation(async (user) => ({ id: 1, ...user }));

      const result = await service.create(dto);

      expect(mockUserRepository.create).toHaveBeenCalledWith(expect.objectContaining({ email: dto.email }));
      expect(mockUserRepository.save).toHaveBeenCalled();

      // 비밀번호가 해시되었는지 확인
      const isMatch = await bcrypt.compare(dto.password, result.password);
      expect(isMatch).toBe(true);
    });
  });

  describe('findByEmail', () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      password: 'hashed_password',
    };
  
    
    it('should return user when found', async () => {
      mockUserRepository.findOne!.mockResolvedValue(mockUser);
      const result = await service.findByEmail('test@example.com');
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      mockUserRepository.findOne!.mockResolvedValue(null);
      const result = await service.findByEmail('notfound@example.com');
      expect(result).toBeNull();
    });
  });

  describe('updatePassword', () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      password: 'hashed_password',
    };
    
    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne!.mockResolvedValue(null);

      await expect(
        service.updatePassword('notfound@example.com', 'newpass'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should hash new password and save user', async () => {
      const userWithOldPassword = { ...mockUser, password: 'old_hashed' };
      mockUserRepository.findOne!.mockResolvedValue(userWithOldPassword);
      mockUserRepository.save!.mockImplementation(async (user) => user);

      await service.updatePassword('test@example.com', 'newpass123');

      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          password: expect.any(String),
        }),
      );

      const savedUser = mockUserRepository.save!.mock.calls[0][0];
      const isMatch = await bcrypt.compare('newpass123', savedUser.password);
      expect(isMatch).toBe(true);
    });
  });

});

