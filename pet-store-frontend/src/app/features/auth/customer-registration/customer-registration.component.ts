import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../../core/stores/auth.store';
import { RegistrationResponse } from '../../../core/models/user.model';

@Component({
  selector: 'app-customer-registration',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="registration-container">
      <div class="registration-card">
        @if (registrationResult(); as res) {
          <!-- Registration Success / Email Activation Notice -->
          <div class="success-box">
            <div class="icon-circle">
              <span class="envelope-icon">&#9993;</span>
            </div>
            <h2>Verify Your Email</h2>
            <p class="subtitle">
              We have sent an activation link to <strong>{{ res.email }}</strong>.
              Please check your inbox and click the verification link to activate your account.
            </p>

            @if (res.activationUrl) {
              <div class="dev-banner">
                <span class="badge-dev">Development Mode</span>
                <p class="dev-text">In this environment, you can directly activate your account using the link below:</p>
                <a [href]="res.activationUrl" class="btn btn-primary btn-sm dev-link">
                  Activate Account Now &rarr;
                </a>
              </div>
            }

            <div class="action-buttons">
              <a routerLink="/" class="btn btn-outline">Back to Catalog</a>
            </div>
          </div>
        } @else {
          <!-- Registration Form (Signal Forms Exclusive) -->
          <div class="card-header">
            <h2>Create Your Account</h2>
            <p class="subtitle">Join our community to adopt pets and shop for essentials.</p>
          </div>

          @if (errorMessage()) {
            <div class="error-banner">
              <span class="error-icon">&#9888;</span>
              <span>{{ errorMessage() }}</span>
            </div>
          }

          <form (ngSubmit)="onSubmit()" novalidate class="form-body">
            <!-- Full Name -->
            <div class="form-group" [class.has-error]="isFieldInvalid('fullName')">
              <label for="fullName">Full Name *</label>
              <input
                id="fullName"
                type="text"
                [ngModel]="fullName()"
                (ngModelChange)="fullName.set($event)"
                (blur)="markTouched('fullName')"
                name="fullName"
                class="form-control"
                placeholder="e.g. Jane Doe"
                autocomplete="name"
              />
              @if (isFieldInvalid('fullName')) {
                <span class="validation-message">{{ fullNameError() }}</span>
              }
            </div>

            <!-- Username -->
            <div class="form-group" [class.has-error]="isFieldInvalid('username')">
              <label for="username">Username *</label>
              <input
                id="username"
                type="text"
                [ngModel]="username()"
                (ngModelChange)="username.set($event)"
                (blur)="markTouched('username')"
                name="username"
                class="form-control"
                placeholder="e.g. janedoe"
                autocomplete="username"
              />
              @if (isFieldInvalid('username')) {
                <span class="validation-message">{{ usernameError() }}</span>
              }
            </div>

            <!-- Email Address -->
            <div class="form-group" [class.has-error]="isFieldInvalid('email')">
              <label for="email">Email Address *</label>
              <input
                id="email"
                type="email"
                [ngModel]="email()"
                (ngModelChange)="email.set($event)"
                (blur)="markTouched('email')"
                name="email"
                class="form-control"
                placeholder="e.g. jane.doe@example.com"
                autocomplete="email"
              />
              @if (isFieldInvalid('email')) {
                <span class="validation-message">{{ emailError() }}</span>
              }
            </div>

            <!-- Phone (Optional) -->
            <div class="form-group" [class.has-error]="isFieldInvalid('phone')">
              <label for="phone">Phone Number (Optional)</label>
              <input
                id="phone"
                type="tel"
                [ngModel]="phone()"
                (ngModelChange)="phone.set($event)"
                (blur)="markTouched('phone')"
                name="phone"
                class="form-control"
                placeholder="e.g. +1-555-0199"
                autocomplete="tel"
              />
              @if (isFieldInvalid('phone')) {
                <span class="validation-message">{{ phoneError() }}</span>
              }
            </div>

            <!-- Password -->
            <div class="form-group" [class.has-error]="isFieldInvalid('password')">
              <label for="password">Password *</label>
              <input
                id="password"
                type="password"
                [ngModel]="password()"
                (ngModelChange)="password.set($event)"
                (blur)="markTouched('password')"
                name="password"
                class="form-control"
                placeholder="At least 8 characters"
                autocomplete="new-password"
              />
              @if (isFieldInvalid('password')) {
                <span class="validation-message">{{ passwordError() }}</span>
              }
            </div>

            <!-- Confirm Password -->
            <div class="form-group" [class.has-error]="isFieldInvalid('confirmPassword')">
              <label for="confirmPassword">Confirm Password *</label>
              <input
                id="confirmPassword"
                type="password"
                [ngModel]="confirmPassword()"
                (ngModelChange)="confirmPassword.set($event)"
                (blur)="markTouched('confirmPassword')"
                name="confirmPassword"
                class="form-control"
                placeholder="Re-enter password"
                autocomplete="new-password"
              />
              @if (isFieldInvalid('confirmPassword')) {
                <span class="validation-message">{{ confirmPasswordError() }}</span>
              }
            </div>

            <div class="form-actions">
              <button
                type="submit"
                class="btn btn-primary btn-block"
                [disabled]="isSubmitting() || !isFormValid()"
              >
                {{ isSubmitting() ? 'Creating Account...' : 'Register' }}
              </button>
            </div>
          </form>

          <div class="card-footer">
            <p>Already have an account? <a routerLink="/" class="link">Sign in from navigation</a></p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .registration-container {
      min-height: calc(100vh - 5rem);
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 2rem 1rem;
      background: var(--bg-alt, #f8fafc);
    }
    .registration-card {
      width: 100%;
      max-width: 480px;
      background: #ffffff;
      border: 1px solid var(--border, #e2e8f0);
      border-radius: 12px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
      padding: 2.25rem;
    }
    .card-header {
      margin-bottom: 1.5rem;
      text-align: center;
    }
    .card-header h2 {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-main, #0f172a);
      margin-bottom: 0.35rem;
    }
    .subtitle {
      font-size: 0.875rem;
      color: var(--text-muted, #64748b);
      line-height: 1.4;
    }
    .form-body {
      display: flex;
      flex-direction: column;
      gap: 1.125rem;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }
    .form-group label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-main, #334155);
    }
    .form-control {
      width: 100%;
      padding: 0.625rem 0.875rem;
      font-size: 0.875rem;
      border: 1px solid var(--border, #cbd5e1);
      border-radius: 6px;
      outline: none;
      transition: all 0.15s ease-in-out;
    }
    .form-control:focus {
      border-color: var(--primary, #4f46e5);
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
    }
    .form-group.has-error .form-control {
      border-color: var(--danger, #ef4444);
    }
    .validation-message {
      font-size: 0.75rem;
      color: var(--danger, #ef4444);
      margin-top: 0.125rem;
    }
    .error-banner {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background-color: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 6px;
      padding: 0.75rem 1rem;
      color: var(--danger, #b91c1c);
      font-size: 0.875rem;
      margin-bottom: 1.25rem;
    }
    .form-actions {
      margin-top: 0.5rem;
    }
    .btn-block {
      width: 100%;
      padding: 0.75rem;
      font-size: 0.9375rem;
      font-weight: 600;
    }
    .card-footer {
      margin-top: 1.5rem;
      text-align: center;
      font-size: 0.8125rem;
      color: var(--text-muted, #64748b);
      border-top: 1px solid var(--border, #e2e8f0);
      padding-top: 1.25rem;
    }
    .card-footer .link {
      color: var(--primary, #4f46e5);
      font-weight: 600;
      text-decoration: none;
    }
    .card-footer .link:hover {
      text-decoration: underline;
    }
    /* Success / Verify email styles */
    .success-box {
      text-align: center;
      padding: 1rem 0;
    }
    .icon-circle {
      width: 4rem;
      height: 4rem;
      background-color: #e0e7ff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.25rem;
    }
    .envelope-icon {
      font-size: 2rem;
      color: var(--primary, #4f46e5);
    }
    .dev-banner {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 1rem;
      margin: 1.5rem 0;
      text-align: left;
    }
    .badge-dev {
      display: inline-block;
      background: #16a34a;
      color: #ffffff;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      margin-bottom: 0.5rem;
    }
    .dev-text {
      font-size: 0.8125rem;
      color: #166534;
      margin-bottom: 0.75rem;
    }
    .dev-link {
      display: inline-block;
      text-decoration: none;
    }
    .action-buttons {
      margin-top: 1.5rem;
    }
    .btn-outline {
      border: 1px solid var(--border, #cbd5e1);
      background: #ffffff;
      color: var(--text-main, #334155);
      padding: 0.625rem 1.25rem;
      border-radius: 6px;
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
      display: inline-block;
    }
    .btn-outline:hover {
      background: #f1f5f9;
    }
  `]
})
export class CustomerRegistrationComponent {
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  // Exclusive Signal Forms: Field State Signals
  readonly fullName = signal('');
  readonly username = signal('');
  readonly email = signal('');
  readonly phone = signal('');
  readonly password = signal('');
  readonly confirmPassword = signal('');

  // Touched state tracker
  readonly touched = signal<Record<string, boolean>>({});

  // Submitting & Feedback Signals
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly registrationResult = signal<RegistrationResponse | null>(null);

  // Signal Field Validators
  readonly fullNameError = computed(() => {
    const val = this.fullName().trim();
    if (!val) return 'Full name is required';
    if (val.length > 100) return 'Full name cannot exceed 100 characters';
    return null;
  });

  readonly usernameError = computed(() => {
    const val = this.username().trim();
    if (!val) return 'Username is required';
    if (val.length < 3 || val.length > 50) return 'Username must be between 3 and 50 characters';
    if (!/^[a-zA-Z0-9_.-]+$/.test(val)) {
      return 'Username can only contain alphanumeric characters, underscores, hyphens, and periods';
    }
    return null;
  });

  readonly emailError = computed(() => {
    const val = this.email().trim();
    if (!val) return 'Email is required';
    if (val.length > 100) return 'Email cannot exceed 100 characters';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Email must be a valid email address';
    return null;
  });

  readonly phoneError = computed(() => {
    const val = this.phone().trim();
    if (val && val.length > 30) return 'Phone number cannot exceed 30 characters';
    return null;
  });

  readonly passwordError = computed(() => {
    const val = this.password();
    if (!val) return 'Password is required';
    if (val.length < 8) return 'Password must be at least 8 characters';
    if (val.length > 64) return 'Password cannot exceed 64 characters';
    return null;
  });

  readonly confirmPasswordError = computed(() => {
    const val = this.confirmPassword();
    if (!val) return 'Please confirm your password';
    if (val !== this.password()) return 'Passwords do not match';
    return null;
  });

  readonly isFormValid = computed(() => {
    return (
      !this.fullNameError() &&
      !this.usernameError() &&
      !this.emailError() &&
      !this.phoneError() &&
      !this.passwordError() &&
      !this.confirmPasswordError()
    );
  });

  markTouched(field: string): void {
    this.touched.update(t => ({ ...t, [field]: true }));
  }

  isFieldInvalid(field: string): boolean {
    if (!this.touched()[field]) return false;
    switch (field) {
      case 'fullName': return !!this.fullNameError();
      case 'username': return !!this.usernameError();
      case 'email': return !!this.emailError();
      case 'phone': return !!this.phoneError();
      case 'password': return !!this.passwordError();
      case 'confirmPassword': return !!this.confirmPasswordError();
      default: return false;
    }
  }

  onSubmit(): void {
    // Mark all touched
    this.touched.set({
      fullName: true,
      username: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true
    });

    if (!this.isFormValid()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.authStore.register({
      username: this.username().trim(),
      email: this.email().trim(),
      password: this.password(),
      fullName: this.fullName().trim(),
      phone: this.phone().trim() || undefined
    }).subscribe({
      next: res => {
        this.isSubmitting.set(false);
        this.registrationResult.set(res);
      },
      error: err => {
        this.isSubmitting.set(false);
        const detail = err.error?.detail || err.error?.message || 'Registration failed. Please check your information.';
        this.errorMessage.set(detail);
      }
    });
  }
}
