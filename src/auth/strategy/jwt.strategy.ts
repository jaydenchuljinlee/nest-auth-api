import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Authorization 헤더에서 추출
      secretOrKey: config.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: any) {
    console.log(payload);
    return { userId: payload.sub, email: payload.email }; // req.user에 들어감
  }
}