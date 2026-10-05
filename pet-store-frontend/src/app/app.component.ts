import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { LoginDialogComponent } from './features/auth/login-dialog/login-dialog.component';
import { CartDrawerComponent } from './features/cart/cart-drawer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, LoginDialogComponent, CartDrawerComponent],
  templateUrl: './app.component.html',
  styles: [`
    .app-layout {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .main-content {
      flex: 1;
    }
    .app-footer {
      background: #ffffff;
      border-top: 1px solid var(--border);
      padding: 1.5rem 0;
      margin-top: auto;
    }
    .footer-content {
      text-align: center;
      font-size: 0.8125rem;
      color: var(--text-muted);
    }
  `]
})
export class AppComponent {
  readonly isLoginOpen = signal<boolean>(false);
}
