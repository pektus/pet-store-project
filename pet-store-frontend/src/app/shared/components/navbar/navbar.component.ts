import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '../../../core/stores/auth.store';
import { CartStore } from '../../../core/stores/cart.store';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
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
    .cart-trigger-btn {
      position: relative;
      background: transparent;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 0.375rem 0.75rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      transition: all 0.15s ease;
      color: var(--text-main);
      font-size: 0.875rem;
      font-weight: 500;
    }
    .cart-trigger-btn:hover {
      background: #f1f5f9;
      border-color: var(--primary);
    }
    .cart-icon {
      font-size: 1.1rem;
    }
    .cart-label {
      font-size: 0.875rem;
    }
    .cart-badge {
      background: var(--primary);
      color: #ffffff;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.1rem 0.45rem;
      border-radius: 9999px;
      min-width: 1.25rem;
      text-align: center;
    }
  `]
})
export class NavbarComponent {
  readonly authStore = inject(AuthStore);
  readonly cartStore = inject(CartStore);
  readonly openLogin = output<void>();
}
