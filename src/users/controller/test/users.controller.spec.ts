import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../users.controller';
import { UsersService } from '../../service/users.service';

describe('UsersController', () => {
  let controller: UsersController;

  const mockUserService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUserService, // ✅ 서비스 의존성 주입
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
