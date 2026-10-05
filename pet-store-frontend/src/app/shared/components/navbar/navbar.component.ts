import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '../../../core/stores/auth.store';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="navbar">
      <div class="container nav-content">
        <a routerLink="/" class="brand">
          <span class="logo-icon">&#128062;</span>
          <span class="brand-text">PetStore</span>
        </a>

        <nav class="nav-links">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" class="nav-link">
            Catalog
          </a>
          @if (authStore.isAdmin()) {
            <a routerLink="/admin/inventory" routerLinkActive="active" class="nav-link">
              Admin Inventory
            </a>
          }
        </nav>

        <div class="nav-actions">
          @if (authStore.isAuthenticated()) {
            <span class="user-greeting">
              Hello, <strong>{{ authStore.currentUser()?.fullName || authStore.currentUser()?.username }}</strong>
              @if (authStore.isAdmin()) {
                <span class="role-badge badge-admin">Admin</span>
              } @else if (authStore.isCustomer()) {
                <span class="role-badge badge-customer">Customer</span>
              }
            </span>
            <button class="btn btn-secondary btn-sm" (click)="authStore.logout()">
              Sign Out
            </button>
          } @else {
            <a routerLink="/register" class="btn btn-outline btn-sm">
              Register
            </a>
            <button class="btn btn-primary btn-sm" (click)="openLogin.emit()">
              Sign In
            </button>
          }
        </div>
      </div>
    </header>
  `,
  styles: [`
    .navbar {
      background: #ffffff;
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 40;
    }
    .nav-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 4rem;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--primary);
    }
    .logo-icon {
      font-size: 1.5rem;
    }
    .nav-links {
      display: flex;
      gap: 1.5rem;
    }
    .nav-link {
      font-size: 0.9375rem;
      font-weight: 500;
      color: var(--text-muted);
      padding: 0.5rem 0.25rem;
      border-bottom: 2px solid transparent;
      transition: all 0.15s ease;
    }
    .nav-link:hover, .nav-link.active {
      color: var(--primary);
      border-bottom-color: var(--primary);
    }
    .nav-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .user-greeting {
      font-size: 0.875rem;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .role-badge {
      font-size: 0.7rem;
      padding: 0.125rem 0.375rem;
      border-radius: 4px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge-admin {
      background-color: #fee2e2;
      color: #b91c1c;
    }
    .badge-customer {
      background-color: #e0e7ff;
      color: #4338ca;
    }
    .btn-outline {
      border: 1px solid var(--border);
      background: transparent;
      color: var(--text-main);
      padding: 0.375rem 0.75rem;
      border-radius: 6px;
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
      display: inline-block;
      transition: all 0.15s ease;
    }
    .btn-outline:hover {
      background: #f1f5f9;
      border-color: var(--text-muted);
    }
  `]
})
export class NavbarComponent {
  readonly authStore = inject(AuthStore);
  readonly openLogin = output<void>();
}
