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
              Hello, <strong>{{ authStore.currentUser()?.username }}</strong>
            </span>
            <button class="btn btn-secondary btn-sm" (click)="authStore.logout()">
              Sign Out
            </button>
          } @else {
            <button class="btn btn-primary btn-sm" (click)="openLogin.emit()">
              Admin Sign In
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
      gap: 1rem;
    }
    .user-greeting {
      font-size: 0.875rem;
      color: var(--text-muted);
    }
  `]
})
export class NavbarComponent {
  readonly authStore = inject(AuthStore);
  readonly openLogin = output<void>();
}
