export type UserRole = 'ROLE_ADMIN' | 'ROLE_STAFF' | 'ROLE_CUSTOMER' | 'ROLE_ACCOUNTANT';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  fullName?: string | null;
  phone?: string | null;
  isEmailVerified?: boolean;
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

export interface CustomerRegistrationRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface RegistrationResponse {
  message: string;
  username: string;
  email: string;
  activationToken: string;
  activationUrl: string;
}

export interface VerifyEmailResponse {
  message: string;
  token: string;
  tokenType: string;
  expiresIn: number;
  user: UserProfile;
}

export interface CustomerProfileUpdateRequest {
  fullName: string;
  phone?: string;
}
