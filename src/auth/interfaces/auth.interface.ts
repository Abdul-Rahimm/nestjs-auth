export interface JwtPayload {
  sub: number;
  email: string;
}

export interface AuthResponse {
  message: string;
  token?: string;
}
