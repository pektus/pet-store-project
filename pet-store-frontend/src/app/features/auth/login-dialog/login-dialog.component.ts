import { Component, input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../../core/stores/auth.store';

@Component({
  selector: 'app-login-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login-dialog.component.html',
  styles: [`
    .login-box {
      max-width: 420px;
    }
    .form-group {
      margin-bottom: 1.25rem;
    }
    .form-group label {
      display: block;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 0.375rem;
    }
    .form-control {
      width: 100%;
      padding: 0.625rem 0.875rem;
      border: 1px solid var(--border);
      border-radius: 6px;
      outline: none;
    }
    .form-control:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }
    .error-alert {
      padding: 0.75rem 1rem;
      background-color: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 6px;
      color: var(--danger);
      font-size: 0.875rem;
      margin-bottom: 1.25rem;
    }
    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }
    .signup-prompt {
      font-size: 0.8125rem;
      color: var(--text-muted);
      display: flex;
      gap: 0.35rem;
    }
    .register-link {
      color: var(--primary);
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
    }
    .register-link:hover {
      text-decoration: underline;
    }
    .footer-actions {
      display: flex;
      gap: 0.5rem;
    }
    .close-btn {
      font-size: 1.5rem;
      color: var(--text-muted);
    }
  `]
})
export class LoginDialogComponent {
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  readonly isOpen = input.required<boolean>();
  readonly close = output<void>();

  readonly username = signal<string>('admin');
  readonly password = signal<string>('Password123!');
  readonly errorMessage = signal<string | null>(null);
  readonly isSubmitting = signal<boolean>(false);

  onSubmit(): void {
    if (!this.username() || !this.password()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.authStore.login({
      usernameOrEmail: this.username().trim(),
      password: this.password()
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.close.emit();
        if (this.authStore.isAdmin()) {
          this.router.navigate(['/admin/inventory']);
        }
      },
      error: err => {
        this.isSubmitting.set(false);
        const detail = err.error?.detail || err.error?.message;
        if (detail && detail.toLowerCase().includes('disabled')) {
          this.errorMessage.set('Your account is not activated. Please verify your email via the activation link.');
        } else {
          this.errorMessage.set(
            detail || 'Invalid username or password credentials.'
          );
        }
      }
    });
  }
}
