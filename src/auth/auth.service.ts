import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
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
import { SignupDto, LoginDto, UpdateUserDto } from './dto/auth.dto';
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

    // const saltRounds = 12;
    // const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = this.userRepository.create({
      email,
      passwordHash: password,
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

  async updateUser(
    userId: number,
    updateUserDto: UpdateUserDto,
  ): Promise<AuthResponse> {
    const { email, password } = updateUserDto;

    // Validate that at least one field is provided for update
    if (!email && !password) {
      throw new BadRequestException(
        'At least one field (email or password) must be provided for update',
      );
    }

    // Find the user first
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if email is being updated and if it already exists
    if (email && email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email },
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      user.email = email;
    }

    // Hash password if it's being updated
    if (password) {
      // const saltRounds = 12;
      // user.passwordHash = await bcrypt.hash(password, saltRounds);
      user.passwordHash = password;
    }

    // Save the updated user
    await this.userRepository.save(user);

    return {
      message: 'User updated successfully',
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
