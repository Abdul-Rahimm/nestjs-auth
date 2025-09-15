import { Role } from '../enums/roles.enum';

export interface JwtPayload {
  sub: number;
  email: string;
  role: Role;
  createdAt: string;
}

export interface AuthResponse {
  message: string;
  token?: string;
}
