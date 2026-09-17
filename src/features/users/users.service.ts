import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';

import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { hashPassword } from '@/common/utils';
import { IFileService } from '@/providers/files/files.adapter';
import { IUploadedMulterFile } from '@/providers/files/s3/interfaces';
import {
  AvatarResponseDto,
  CreateUserDto,
  SearchActiveUsersDto,
  SearchUsersDto,
  UpdateUserDto,
} from './dto';
import { UsersRepository } from './repositories';
import { InsertUser, RawUser, UpdateUser } from './types/users.types';

@Injectable()
export class UsersService {
  private readonly logger: Logger = new Logger(UsersService.name);

  constructor(
    private readonly repository: UsersRepository,
    private readonly s3Service: IFileService,
  ) {}

  async search(dto: SearchUsersDto): Promise<RawUser[]> {
    return this.repository.searchUser(dto);
  }

  async searchActive(dto: SearchActiveUsersDto): Promise<RawUser[]> {
    return this.repository.findActiveUsers(dto);
  }

  async getById(id: string): Promise<RawUser> {
    const user = await this.repository.findById(id);

    if (!user) {
      this.logger.warn(`User not found: ${id}`);
      throw new NotFoundException(`user ${id} not found`);
    }

    return user;
  }

  async getByLogin(login: string): Promise<RawUser> {
    const user = await this.repository.findUserByLogin(login);

    if (!user) throw new NotFoundException('user not found');

    return user;
  }

  async getByEmail(email: string): Promise<RawUser> {
    const user = await this.repository.findUserByEmail(email);

    if (!user) throw new NotFoundException('user not found');

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
      throw new NotFoundException(`user ${id} not found`);
    }

    this.logger.log(`Successfully updated: ${id}`);

    return user;
  }

  async delete(id: string): Promise<RawUser> {
    this.logger.log(`Deleting user: ${id}`);

    const user = await this.repository.softDeleteUserById(id);

    if (!user) {
      this.logger.warn(`User not found: ${id}`);
      throw new NotFoundException(`user ${id} not found`);
    }

    this.logger.log(`Successfully deleted: ${id}`);

    return user;
  }

  async uploadAvatar(
    userId: string,
    file: IUploadedMulterFile,
  ): Promise<string> {
    this.logger.log(`Uploading avatar for user: ${userId}`);

    await this.getById(userId);

    const name = `${randomUUID()}${extname(file.originalname).toLowerCase()}`;

    await this.s3Service.uploadFile({ file, folder: 'avatars', name });
    const avatar = await this.repository.createAvatar({
      userId,
      path: `avatars/${name}`,
    });

    this.logger.log(`Successfully uploaded avatar: ${avatar.id}`);

    return avatar.id;
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
      throw new NotFoundException(`avatar ${avatarId} not found`);
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

    const deletedAvatar = await this.repository.deleteAvatarByIdAndUserId(
      avatarId,
      isAdmin ? null : userId,
    );

    if (!deletedAvatar) {
      this.logger.warn(`Avatar not found: ${avatarId}`);
      throw new NotFoundException(`avatar ${avatarId} not found`);
    }

    await this.s3Service.deleteFile(deletedAvatar.path);

    this.logger.log(`Successfully deleted avatar: ${avatarId}`);
  }
}
