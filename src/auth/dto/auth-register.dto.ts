import { OmitType } from '@nestjs/swagger';

import { CreateUserDto } from '@/users/dto';

export class AuthRegisterDto extends OmitType(CreateUserDto, ['role']) {}
