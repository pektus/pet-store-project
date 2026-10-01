import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthResponse, LoginRequest, UserProfile } from '../models/user.model';

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

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/login', credentials).pipe(
      tap(response => {
        this.setSession(response.accessToken, response.user);
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
