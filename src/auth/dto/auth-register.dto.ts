import { OmitType } from '@nestjs/swagger';

import { CreateUserDto } from '@/features/users/dto';

export class AuthRegisterDto extends OmitType(CreateUserDto, ['role']) {}
