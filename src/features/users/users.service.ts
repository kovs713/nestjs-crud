import { Injectable, NotFoundException } from '@nestjs/common';

import { hashPassword } from '@/common/utils';
import { CreateUserDto, SearchUsersDto, UpdateUserDto } from './dto';
import { UsersRepository } from './repositories/users.repository';
import { InsertUser, RawUser, UpdateUser } from './types/users.types';

@Injectable()
export class UsersService {
  constructor(private readonly repository: UsersRepository) {}

  async search(dto: SearchUsersDto): Promise<RawUser[]> {
    return this.repository.search(dto);
  }

  async getById(id: string): Promise<RawUser> {
    const user = await this.repository.findById(id);

    if (!user) throw new NotFoundException(`user ${id} not found`);

    return user;
  }

  async getByLogin(login: string): Promise<RawUser> {
    const user = await this.repository.findByLogin(login);

    if (!user) throw new NotFoundException('user not found');

    return user;
  }

  async getByEmail(email: string): Promise<RawUser> {
    const user = await this.repository.findByEmail(email);

    if (!user) throw new NotFoundException('user not found');

    return user;
  }

  async create(dto: CreateUserDto): Promise<RawUser> {
    const userData: InsertUser = {
      login: dto.login,
      passwordHash: await hashPassword(dto.password),
      role: dto.role,
      email: dto.email,
      age: dto.age,
      description: dto.description,
    };

    return this.repository.create(userData);
  }

  async update(id: string, dto: UpdateUserDto): Promise<RawUser> {
    const { password, ...rest } = dto;

    const userData: UpdateUser = {
      ...rest,
      ...(password !== undefined && {
        passwordHash: await hashPassword(password),
      }),
    };

    const user = await this.repository.updateById(id, userData);
    if (!user) throw new NotFoundException(`user ${id} not found`);

    return user;
  }

  async delete(id: string): Promise<RawUser> {
    const user = await this.repository.softDeleteById(id);

    if (!user) throw new NotFoundException(`user ${id} not found`);

    return user;
  }
}
