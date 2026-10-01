export type UserRole = 'ROLE_ADMIN' | 'ROLE_STAFF';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: UserRole;
}

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserProfile;
}
