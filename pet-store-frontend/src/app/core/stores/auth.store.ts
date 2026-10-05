import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {
  AuthResponse,
  CustomerProfileUpdateRequest,
  CustomerRegistrationRequest,
  LoginRequest,
  RegistrationResponse,
  UserProfile,
  VerifyEmailResponse
} from '../models/user.model';

const TOKEN_KEY = 'petstore_jwt_token';
const USER_KEY = 'petstore_user_profile';

@Injectable({
  providedIn: 'root'
})
export class AuthStore {
  private readonly http = inject(HttpClient);

  readonly token = signal<string | null>(this.getInitialToken());
  readonly currentUser = signal<UserProfile | null>(this.getInitialUser());

  readonly isAuthenticated = computed(() => !!this.token() && !!this.currentUser());
  readonly isAdmin = computed(() => this.currentUser()?.role === 'ROLE_ADMIN');
  readonly isStaff = computed(() => this.currentUser()?.role === 'ROLE_STAFF');
  readonly isCustomer = computed(() => this.currentUser()?.role === 'ROLE_CUSTOMER');

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/login', credentials).pipe(
      tap(response => {
        this.setSession(response.accessToken, response.user);
      })
    );
  }

  register(payload: CustomerRegistrationRequest): Observable<RegistrationResponse> {
    return this.http.post<RegistrationResponse>('/api/auth/register', payload);
  }

  verifyEmail(token: string): Observable<VerifyEmailResponse> {
    return this.http.get<VerifyEmailResponse>(`/api/auth/verify?token=${encodeURIComponent(token)}`).pipe(
      tap(response => {
        this.setSession(response.token, response.user);
      })
    );
  }

  resendVerification(identifier: string): Observable<RegistrationResponse> {
    return this.http.post<RegistrationResponse>(
      `/api/auth/resend-verification?identifier=${encodeURIComponent(identifier)}`,
      {}
    );
  }

  updateCustomerProfile(update: CustomerProfileUpdateRequest): Observable<UserProfile> {
    return this.http.put<UserProfile>('/api/customer/profile', update).pipe(
      tap(updatedProfile => {
        localStorage.setItem(USER_KEY, JSON.stringify(updatedProfile));
        this.currentUser.set(updatedProfile);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.token.set(null);
    this.currentUser.set(null);
  }

  fetchCurrentUser(): Observable<UserProfile> {
    return this.http.get<UserProfile>('/api/auth/me').pipe(
      tap(profile => {
        localStorage.setItem(USER_KEY, JSON.stringify(profile));
        this.currentUser.set(profile);
      })
    );
  }

  private setSession(token: string, user: UserProfile): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.token.set(token);
    this.currentUser.set(user);
  }

  private getInitialToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private getInitialUser(): UserProfile | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserProfile;
    } catch {
      return null;
    }
  }
}
