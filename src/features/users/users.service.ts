import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';

import { hashPassword } from '@/common/utils';
import { CacheService } from '@/providers/cache/cache.service';
import { IFileService } from '@/providers/files/files.adapter';
import { IUploadedMulterFile } from '@/providers/files/s3/interfaces';
import {
  AvatarResponseDto,
  CreateUserDto,
  SearchActiveUsersDto,
  SearchUsersDto,
  UpdateUserDto,
  UploadAvatarResponseDto,
} from './dto';
import { ActiveUserResponseDto } from './dto/active-user-response.dto';
import { AvatarNotFoundException, UserNotFoundException } from './exceptions';
import { UsersRepository } from './repositories';
import { InsertUser, RawUser, UpdateUser } from './types/users.types';
import {
  CACHE_TTL_LIST,
  CACHE_TTL_USER,
  USER_ACTIVE_CACHE_KEY,
  USER_ACTIVE_CACHE_PREFIX,
  USER_CACHE_KEY,
  USER_SEARCH_CACHE_KEY,
  USER_SEARCH_CACHE_PREFIX,
} from './users.constants';

@Injectable()
export class UsersService {
  private readonly logger: Logger = new Logger(UsersService.name);

  constructor(
    private readonly repository: UsersRepository,
    private readonly s3Service: IFileService,
    private readonly cache: CacheService,
  ) {}

  // Users

  async search(dto: SearchUsersDto): Promise<RawUser[]> {
    const key = USER_SEARCH_CACHE_KEY(dto);
    const cached = await this.cache.get<RawUser[]>(key);
    if (cached) return cached;

    const users = await this.repository.searchUser(dto);
    await this.cache.set(key, users, CACHE_TTL_LIST);

    return users;
  }

  async searchActive(
    dto: SearchActiveUsersDto,
  ): Promise<ActiveUserResponseDto[]> {
    const key = USER_ACTIVE_CACHE_KEY(dto);
    const cached = await this.cache.get<ActiveUserResponseDto[]>(key);
    if (cached) return cached;

    const users = await this.repository.findActiveUsers(dto);
    await this.cache.set(key, users, CACHE_TTL_LIST);

    return users;
  }

  async getById(id: string): Promise<RawUser> {
    const key = USER_CACHE_KEY(id);
    const cached = await this.cache.get<RawUser>(key);
    if (cached) return cached;

    const user = await this.repository.findById(id);

    if (!user) {
      this.logger.warn(`User not found: ${id}`);
      throw new UserNotFoundException(id);
    }

    await this.cache.set(key, user, CACHE_TTL_USER);

    return user;
  }

  async getByLogin(login: string): Promise<RawUser> {
    const user = await this.repository.findUserByLogin(login);

    if (!user) throw new UserNotFoundException();

    return user;
  }

  async getByEmail(email: string): Promise<RawUser> {
    const user = await this.repository.findUserByEmail(email);

    if (!user) throw new UserNotFoundException();

    return user;
  }

  async create(dto: CreateUserDto): Promise<RawUser> {
    this.logger.log(`Creating user: ${dto.login}`);

    const userData: InsertUser = {
      login: dto.login,
      passwordHash: await hashPassword(dto.password),
      role: dto.role,
      email: dto.email,
      age: dto.age,
      description: dto.description,
    };

    const user = await this.repository.createUser(userData);

    await this.invalidateListCaches();

    this.logger.log(`Successfully created: ${user.id}`);

    return user;
  }

  async update(id: string, dto: UpdateUserDto): Promise<RawUser> {
    this.logger.log(`Updating user: ${id}`);

    const { password, ...rest } = dto;

    const userData: UpdateUser = {
      ...rest,
      ...(password !== undefined && {
        passwordHash: await hashPassword(password),
      }),
    };

    const user = await this.repository.updateUserById(id, userData);
    if (!user) {
      this.logger.warn(`User not found: ${id}`);
      throw new UserNotFoundException(id);
    }

    await this.invalidateListCaches();
    await this.cache.del(USER_CACHE_KEY(user.id));

    this.logger.log(`Successfully updated: ${id}`);

    return user;
  }

  async delete(id: string): Promise<RawUser> {
    this.logger.log(`Deleting user: ${id}`);

    const user = await this.repository.softDeleteUserById(id);

    if (!user) {
      this.logger.warn(`User not found: ${id}`);
      throw new UserNotFoundException(id);
    }

    await this.invalidateListCaches();
    await this.cache.del(USER_CACHE_KEY(user.id));

    this.logger.log(`Successfully deleted: ${id}`);

    return user;
  }

  // Avatars

  async uploadAvatar(
    userId: string,
    file: IUploadedMulterFile,
  ): Promise<UploadAvatarResponseDto> {
    this.logger.log(`Uploading avatar for user: ${userId}`);

    const name = `${randomUUID()}${extname(file.originalname).toLowerCase()}`;

    await this.s3Service.uploadFile({ file, folder: 'avatars', name });
    const avatar = await this.repository.createAvatar({
      userId,
      path: `avatars/${name}`,
    });

    await this.invalidateListCaches();

    this.logger.log(`Successfully uploaded avatar: ${avatar.id}`);

    return { id: avatar.id };
  }

  async getUserAvatarUrls(userId: string): Promise<AvatarResponseDto[]> {
    const rows = await this.repository.findAvatarsByUserId(userId);

    return Promise.all(
      rows.map(async (row) => ({
        id: row.id,
        presignedUrl: await this.s3Service.readFile(row.path),
      })),
    );
  }

  async getAvatar(avatarId: string): Promise<AvatarResponseDto> {
    const avatar = await this.repository.findAvatarById(avatarId);

    if (!avatar) {
      this.logger.warn(`Avatar not found: ${avatarId}`);
      throw new AvatarNotFoundException(avatarId);
    }

    return {
      id: avatar.id,
      presignedUrl: await this.s3Service.readFile(avatar.path),
    };
  }

  async deleteAvatar(
    userId: string,
    isAdmin: boolean,
    avatarId: string,
  ): Promise<void> {
    this.logger.log(`Deleting avatar: ${avatarId}`);

    const deletedAvatar = await this.repository.softDeleteAvatarByIdAndUserId(
      avatarId,
      isAdmin ? null : userId,
    );

    if (!deletedAvatar) {
      this.logger.warn(`Avatar not found: ${avatarId}`);
      throw new AvatarNotFoundException(avatarId);
    }

    this.logger.log(`Successfully deleted avatar: ${avatarId}`);

    await this.invalidateListCaches();
  }

  private async invalidateListCaches(): Promise<void> {
    await this.cache.delByPrefix(USER_ACTIVE_CACHE_PREFIX);
    await this.cache.delByPrefix(USER_SEARCH_CACHE_PREFIX);
  }
}
