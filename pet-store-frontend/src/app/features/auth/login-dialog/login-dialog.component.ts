import { Component, input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthStore } from '../../../core/stores/auth.store';

@Component({
  selector: 'app-login-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (isOpen()) {
      <div class="modal-overlay" (click)="close.emit()">
        <div class="modal-content login-box" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Admin Sign In</h3>
            <button class="close-btn" (click)="close.emit()">&times;</button>
          </div>

          <form (ngSubmit)="onSubmit()">
            <div class="modal-body">
              @if (errorMessage()) {
                <div class="error-alert">
                  {{ errorMessage() }}
                </div>
              }

              <div class="form-group">
                <label for="username">Username or Email</label>
                <input 
                  id="username" 
                  type="text" 
                  required 
                  [ngModel]="username()" 
                  (ngModelChange)="username.set($event)" 
                  name="username" 
                  class="form-control" 
                  placeholder="e.g. admin" />
              </div>

              <div class="form-group">
                <label for="password">Password</label>
                <input 
                  id="password" 
                  type="password" 
                  required 
                  [ngModel]="password()" 
                  (ngModelChange)="password.set($event)" 
                  name="password" 
                  class="form-control" 
                  placeholder="••••••••" />
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="close.emit()">Cancel</button>
              <button 
                type="submit" 
                class="btn btn-primary" 
                [disabled]="isSubmitting() || !username() || !password()">
                {{ isSubmitting() ? 'Signing in...' : 'Sign In' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
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
        this.router.navigate(['/admin/inventory']);
      },
      error: err => {
        this.isSubmitting.set(false);
        this.errorMessage.set(
          err.error?.detail || 'Invalid username or password credentials.'
        );
      }
    });
  }
}
