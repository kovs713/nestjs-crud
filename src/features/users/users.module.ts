import { Module } from '@nestjs/common';

import { AvatarRepository, UsersRepository } from './repositories';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, AvatarRepository],
  exports: [UsersService],
})
export class UsersModule {}
