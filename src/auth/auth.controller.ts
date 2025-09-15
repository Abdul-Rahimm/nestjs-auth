import {
  Controller,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  ValidationPipe,
  ParseIntPipe,
  Delete,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto, LoginDto, UpdateUserDto } from './dto/auth.dto';
import { AuthResponse } from './interfaces/auth.interface';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { GetUser } from './decorators/get-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { Role } from './enums/roles.enum';

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
    @GetUser() user: { userId: number; email: string; role: Role },
  ): Promise<AuthResponse> {
    return this.authService.logout(user.userId);
  }

  @Patch('update/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async updateUser(
    @Param('id', ParseIntPipe) userId: number,
    @Body(ValidationPipe) updateUserDto: UpdateUserDto,
  ): Promise<AuthResponse> {
    return this.authService.updateUser(userId, updateUserDto);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getAllUsers(): Promise<any> {
    return this.authService.getAllUsers();
  }

  @Delete('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async deleteUser(
    @Param('id', ParseIntPipe) userId: number,
  ): Promise<AuthResponse> {
    return this.authService.deleteUser(userId);
  }
}
