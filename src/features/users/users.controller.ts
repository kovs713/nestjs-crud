import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  QueryMethod,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
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
import type { IUploadedMulterFile } from '@/providers/files/s3/interfaces';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  CreateUserDto,
  SearchUsersDto,
  toUserResponse,
  UpdateUserDto,
  UserResponseDto,
} from './dto';
import { AvatarResponseDto } from './dto/avatar-response.dto';
import { SelfOrAdminGuard } from './guards/self-or-admin.guard';
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

  @Patch('avatars')
  @UseInterceptors(FileInterceptor('file'))
  @Idempotent()
  @ApiOperation({
    summary: 'Upload an avatar',
    description:
      'Uploads an image (jpeg/png/webp, up to 5 MB) as a new avatar of the currently authenticated user. Returns the new avatar id.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOkResponse({ type: String, description: 'Id of the created avatar' })
  @ApiBadRequestResponse({
    description: 'Missing file, too large, or not an image',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid or expired access token',
  })
  async uploadAvatar(
    @Req() req: RequestWithUser<JwtPayloadType>,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: IUploadedMulterFile,
  ): Promise<string> {
    return await this.service.uploadAvatar(req.user.id, file);
  }

  @Patch(':id')
  @UseGuards(SelfOrAdminGuard)
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
  ): Promise<UserResponseDto> {
    return toUserResponse(await this.service.update(id, dto));
  }

  @Delete(':id')
  @UseGuards(SelfOrAdminGuard)
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
  ): Promise<UserResponseDto> {
    return toUserResponse(await this.service.delete(id));
  }

  @Get('profile/avatars/my')
  @ApiOperation({
    summary: 'List own avatars',
    description:
      'Returns the avatars of the currently authenticated user with presigned view urls.',
  })
  @ApiOkResponse({
    type: [AvatarResponseDto],
    description: 'Own avatars (may be empty)',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid or expired access token',
  })
  async getMyProfileAvatars(
    @Req() req: RequestWithUser<JwtPayloadType>,
  ): Promise<AvatarResponseDto[]> {
    return await this.service.getUserAvatarUrls(req.user.id);
  }

  @Get('profile/avatars/:userId')
  @ApiOperation({
    summary: "List a user's avatars",
    description:
      'Returns the avatars of the given user with presigned view urls. Requires authentication.',
  })
  @ApiParam({
    name: 'userId',
    format: 'uuid',
    description: 'UUID of the user whose avatars to fetch',
  })
  @ApiOkResponse({
    type: [AvatarResponseDto],
    description: "User's avatars (may be empty)",
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid or expired access token',
  })
  async getProfileAvatars(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<AvatarResponseDto[]> {
    return await this.service.getUserAvatarUrls(userId);
  }

  @Get('avatars/:avatarId')
  @ApiOperation({
    summary: 'Get an avatar',
    description:
      'Returns a single avatar with a presigned view url. Requires authentication.',
  })
  @ApiParam({
    name: 'avatarId',
    format: 'uuid',
    description: 'UUID of the avatar to fetch',
  })
  @ApiOkResponse({ type: AvatarResponseDto, description: 'Requested avatar' })
  @ApiNotFoundResponse({ description: 'No avatar exists with the given id' })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid or expired access token',
  })
  async getAvatar(
    @Param('avatarId', ParseUUIDPipe) avatarId: string,
  ): Promise<AvatarResponseDto> {
    return await this.service.getAvatar(avatarId);
  }

  @Delete('avatars/:avatarId')
  @ApiOperation({
    summary: 'Delete an avatar',
    description:
      'Deletes an avatar (database row and stored file). Users may delete their own avatars, admins may delete anyone.',
  })
  @ApiParam({
    name: 'avatarId',
    format: 'uuid',
    description: 'UUID of the avatar to delete',
  })
  @ApiOkResponse({ description: 'Avatar deleted' })
  @ApiNotFoundResponse({
    description:
      'No avatar exists with the given id or it belongs to someone else',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid or expired access token',
  })
  async deleteAvatar(
    @Param('avatarId', ParseUUIDPipe) avatarId: string,
    @Req() req: RequestWithUser<JwtPayloadType>,
  ): Promise<void> {
    return await this.service.deleteAvatar(
      req.user.id,
      req.user.role === 'admin',
      avatarId,
    );
  }
}
