import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { AllConfigType } from '@/config';
import { JwtPayloadType } from '../types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService<AllConfigType>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow<string>('auth.jwtSecret', { infer: true }),
    });
  }

  public validate(payload: JwtPayloadType): JwtPayloadType {
    if (!payload.id || payload.type !== 'access') {
      throw new UnauthorizedException();
    }

    return payload;
  }
}
