export interface JwtPayload {
  sub: number;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  message: string;
  token?: string;
}
