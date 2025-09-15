import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../interfaces/auth.interface';
import { ConfigService } from '@nestjs/config';
import { Role } from '../enums/roles.enum';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SECRET') || 'default-secret-key',
    });
  }

  async validate(
    payload: JwtPayload,
  ): Promise<{ userId: number; email: string; role: Role }> {
    if (!payload.sub || !payload.email || !payload.role) {
      throw new UnauthorizedException();
    }
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
