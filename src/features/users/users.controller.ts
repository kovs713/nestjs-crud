import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  QueryMethod,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Roles } from '@/auth/decorators';
import { RolesGuard } from '@/auth/guards';
import { JwtPayloadType } from '@/auth/types';
import type { RequestWithUser } from '@/common/types';
import {
  CreateUserDto,
  SearchUsersDto,
  toUserResponse,
  UpdateUserDto,
  UserResponseDto,
} from './dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  // "backward compatibility"
  @Get()
  async search(@Query() dto: SearchUsersDto): Promise<UserResponseDto[]> {
    const users = await this.service.search(dto);
    return users.map(toUserResponse);
  }

  // new http query method
  @QueryMethod()
  async searchByBody(@Body() dto: SearchUsersDto): Promise<UserResponseDto[]> {
    const users = await this.service.search(dto);
    return users.map(toUserResponse);
  }

  @Get('profile/my')
  async getMy(
    @Req() req: RequestWithUser<JwtPayloadType>,
  ): Promise<UserResponseDto> {
    return toUserResponse(await this.service.getById(req.user.id));
  }

  @Get(':id')
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserResponseDto> {
    return toUserResponse(await this.service.getById(id));
  }

  @Roles('admin')
  @Post()
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return toUserResponse(await this.service.create(dto));
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @Req() req: RequestWithUser<JwtPayloadType>,
  ): Promise<UserResponseDto> {
    this.assertSelfOrAdmin(req.user, id);

    return toUserResponse(await this.service.update(id, dto));
  }

  @Delete(':id')
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser<JwtPayloadType>,
  ): Promise<UserResponseDto> {
    this.assertSelfOrAdmin(req.user, id);

    return toUserResponse(await this.service.delete(id));
  }

  private assertSelfOrAdmin(actor: JwtPayloadType, id: string): void {
    if (actor.id !== id && actor.role !== 'admin')
      throw new ForbiddenException();
  }
}
