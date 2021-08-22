import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { User } from './user.entity';
import { UsersService } from './users.service';

describe('AuthService', () => {
  let service: AuthService;
  let fakeUsersService: Partial<UsersService>;

  beforeEach(async () => {
    // Create a fake copy of the users service
    const users: User[] = [];
    fakeUsersService = {
      find: (email: string) => {
        const filteredUsers = users.filter((user) => user.email === email);
        return Promise.resolve(filteredUsers);
      },
      create: (email: string, password: string) => {
        const user = {
          id: Math.floor(Math.random() * 999999),
          email,
          password,
        } as User;
        users.push(user);
        return Promise.resolve(user);
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: fakeUsersService,
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('can creat an instance of auth service', async () => {
    expect(service).toBeDefined();
  });

  it('creates a new user with a salted and hashed password', async () => {
    const user = await service.signup('admin@admin.com', '12341234');
    expect(user.password).not.toEqual('12341234');
    const [salt, hash] = user.password.split('.');
    expect(salt).toBeDefined();
    expect(hash).toBeDefined();
  });

  it('throws an error if user signs up with email that is in use', async () => {
    await service.signup('admin@admin.com', '12341234');
    try {
      await service.signup('admin@admin.com', '12341234');
    } catch (error) {
      console.log(
        'throws an error if user signs up with email that is in use\n',
        error,
      );
      Promise.resolve();
    }
  });

  it('throws if signin is called with an unused email', async () => {
    try {
      await service.signin(
        'admin2@admin.com',
        '8cac0d94e4946752.cdd28e47bcfbe240ad79fd488279626df5c98eddeac3d7d6255b78d23153ded1',
      );
    } catch (error) {
      console.log('throws if signin is called with an unused email\n', error);
      Promise.resolve();
    }
  });

  it('throws if an invalid password is provided', async () => {
    await service.signup('admin@admin.com', '123412345');
    try {
      await service.signin('admin@admin.com', '12341234');
    } catch (error) {
      console.log('throws if an invalid password is provided\n', error);
      Promise.resolve();
    }
  });

  it('returns a user if correct password is provided', async () => {
    await service.signup('admin@admin.com', '12341234');
    const user = await service.signin('admin@admin.com', '12341234');
    expect(user).toBeDefined();
  });
});
