import {
  Controller,
  Post,
  Body,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto, LoginDto } from './dto/auth.dto';
import { AuthResponse } from './interfaces/auth.interface';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GetUser } from './decorators/get-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(
    @Body(ValidationPipe) signupDto: SignupDto,
  ): Promise<AuthResponse> {
    return this.authService.signup(signupDto);
  }

  @Post('login')
  async login(@Body(ValidationPipe) loginDto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(loginDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(
    @GetUser() user: { userId: number; email: string },
  ): Promise<AuthResponse> {
    return this.authService.logout(user.userId);
  }
}
