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
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { Roles } from '@/auth/decorators';
import { RolesGuard } from '@/auth/guards';
import { JwtPayloadType } from '@/auth/types';
import { Idempotent } from '@/common/idempotency';
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
  @ApiOperation({
    summary: 'Search users (query string)',
    description:
      'Returns users matching an optional case-insensitive login substring, paginated. Requires authentication.',
  })
  @ApiQuery({
    name: 'login',
    required: false,
    type: String,
    description: 'Case-insensitive substring match on login',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 20,
    description: 'Page size, 1-100 (default 20)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    example: 0,
    description: 'Number of users to skip (default 0)',
  })
  @ApiOkResponse({
    type: [UserResponseDto],
    description: 'List of matching users (may be empty)',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid or expired access token',
  })
  async search(@Query() dto: SearchUsersDto): Promise<UserResponseDto[]> {
    const users = await this.service.search(dto);
    return users.map(toUserResponse);
  }

  // new http query method
  @QueryMethod()
  @ApiOperation({
    summary: 'Search users (request body)',
    description:
      'Same as the GET search endpoint but takes filters in the JSON body via the HTTP QUERY method.',
  })
  @ApiOkResponse({
    type: [UserResponseDto],
    description: 'List of matching users (may be empty)',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid or expired access token',
  })
  async searchByBody(@Body() dto: SearchUsersDto): Promise<UserResponseDto[]> {
    const users = await this.service.search(dto);
    return users.map(toUserResponse);
  }

  @Get('profile/my')
  @ApiOperation({
    summary: 'Get own profile',
    description:
      'Returns the profile of the currently authenticated user. Equivalent to `GET /auth/me`.',
  })
  @ApiOkResponse({ type: UserResponseDto, description: 'Own profile' })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid or expired access token',
  })
  async getMy(
    @Req() req: RequestWithUser<JwtPayloadType>,
  ): Promise<UserResponseDto> {
    return toUserResponse(await this.service.getById(req.user.id));
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user by id',
    description:
      'Returns a single user profile by its UUID. Requires authentication.',
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'UUID of the user to fetch',
  })
  @ApiOkResponse({ type: UserResponseDto, description: 'Requested user' })
  @ApiNotFoundResponse({ description: 'No user exists with the given id' })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid or expired access token',
  })
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserResponseDto> {
    return toUserResponse(await this.service.getById(id));
  }

  @Roles('admin')
  @Idempotent()
  @Post()
  @ApiOperation({
    summary: 'Create a user',
    description:
      'Creates a user with any role, including `admin`. Admin only. The password is stored hashed and never returned.',
  })
  @ApiCreatedResponse({ type: UserResponseDto, description: 'Created user' })
  @ApiBadRequestResponse({
    description: 'Validation failed (e.g. duplicate login/email)',
  })
  @ApiForbiddenResponse({ description: 'Caller is not an admin' })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid or expired access token',
  })
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return toUserResponse(await this.service.create(dto));
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a user',
    description:
      'Partially updates a user (all fields optional; role cannot be changed here). Users may update their own profile, admins may update anyone.',
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'UUID of the user to update',
  })
  @ApiOkResponse({ type: UserResponseDto, description: 'Updated user' })
  @ApiNotFoundResponse({ description: 'No user exists with the given id' })
  @ApiForbiddenResponse({
    description: 'Authenticated user is neither the target user nor an admin',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid or expired access token',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @Req() req: RequestWithUser<JwtPayloadType>,
  ): Promise<UserResponseDto> {
    this.assertSelfOrAdmin(req.user, id);

    return toUserResponse(await this.service.update(id, dto));
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a user',
    description:
      'Soft-deletes a user (data stays in the database). Users may delete themselves, admins may delete anyone.',
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'UUID of the user to delete',
  })
  @ApiOkResponse({
    type: UserResponseDto,
    description: 'Deleted user as it looked before deletion',
  })
  @ApiNotFoundResponse({ description: 'No user exists with the given id' })
  @ApiForbiddenResponse({
    description: 'Authenticated user is neither the target user nor an admin',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid or expired access token',
  })
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
