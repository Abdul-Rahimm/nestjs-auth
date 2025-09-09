import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '../user/user.entity';
import {
  UserSession,
  SessionAction,
} from '../user-session/user-session.entity';
import { SignupDto, LoginDto } from './dto/auth.dto';
import { AuthResponse, JwtPayload } from './interfaces/auth.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserSession)
    private readonly userSessionRepository: Repository<UserSession>,
    private readonly jwtService: JwtService,
  ) {}

  async signup(signupDto: SignupDto): Promise<AuthResponse> {
    const { email, password } = signupDto;

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = this.userRepository.create({
      email,
      passwordHash,
    });

    await this.userRepository.save(user);

    return {
      message: 'User registered successfully',
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginDto;

    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.logUserSession(user.id, SessionAction.SIGNIN);

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
    };

    const token = this.jwtService.sign(payload);

    return {
      message: 'Login successful',
      token,
    };
  }

  async logout(userId: number): Promise<AuthResponse> {
    await this.logUserSession(userId, SessionAction.SIGNOUT);

    return {
      message: 'Logout successful',
    };
  }

  private async logUserSession(
    userId: number,
    action: SessionAction,
  ): Promise<void> {
    const userSession = this.userSessionRepository.create({
      userId,
      action,
    });

    await this.userSessionRepository.save(userSession);
  }
}
