import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthStore } from '../../../core/stores/auth.store';

@Component({
  selector: 'app-email-verification',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './email-verification.component.html',
  styles: [`
    .verify-container {
      min-height: calc(100vh - 5rem);
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 2rem 1rem;
      background: var(--bg-alt, #f8fafc);
    }
    .verify-card {
      width: 100%;
      max-width: 500px;
      background: #ffffff;
      border: 1px solid var(--border, #e2e8f0);
      border-radius: 12px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
      padding: 2.5rem;
      text-align: center;
    }
    .state-box {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .icon-circle {
      width: 4.5rem;
      height: 4.5rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.25rem;
    }
    .icon-circle.success {
      background-color: #dcfce7;
      color: #16a34a;
      font-size: 2.25rem;
    }
    .icon-circle.error {
      background-color: #fee2e2;
      color: #dc2626;
      font-size: 2.25rem;
    }
    h2 {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-main, #0f172a);
      margin-bottom: 0.5rem;
    }
    .subtitle {
      font-size: 0.875rem;
      color: var(--text-muted, #64748b);
      line-height: 1.5;
      margin-bottom: 1.5rem;
    }
    .error-text {
      font-size: 0.9375rem;
      color: #dc2626;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    .spinner {
      width: 3rem;
      height: 3rem;
      border: 4px solid var(--border, #e2e8f0);
      border-top-color: var(--primary, #4f46e5);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 1.5rem;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .resend-form {
      width: 100%;
      margin: 1rem 0 1.5rem;
      text-align: left;
    }
    .form-group label {
      display: block;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-main, #334155);
      margin-bottom: 0.375rem;
    }
    .input-with-button {
      display: flex;
      gap: 0.5rem;
    }
    .form-control {
      flex: 1;
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
      border: 1px solid var(--border, #cbd5e1);
      border-radius: 6px;
      outline: none;
    }
    .form-control:focus {
      border-color: var(--primary, #4f46e5);
    }
    .alert-success {
      background-color: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #166534;
      padding: 0.75rem;
      border-radius: 6px;
      font-size: 0.875rem;
      text-align: center;
    }
    .actions {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
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
    }
    .btn-outline:hover {
      background: #f1f5f9;
    }
  `]
})
export class EmailVerificationComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly authStore = inject(AuthStore);

  readonly status = signal<'verifying' | 'success' | 'error' | 'no-token'>('verifying');
  readonly errorMessage = signal<string | null>(null);

  // Resend flow signals
  readonly identifier = signal('');
  readonly isResending = signal(false);
  readonly resendSuccess = signal(false);

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.status.set('no-token');
      return;
    }

    this.authStore.verifyEmail(token).subscribe({
      next: () => {
        this.status.set('success');
      },
      error: err => {
        this.status.set('error');
        this.errorMessage.set(
          err.error?.detail || err.error?.message || 'Verification token is invalid or has expired.'
        );
      }
    });
  }

  onResend(): void {
    const id = this.identifier().trim();
    if (!id) return;

    this.isResending.set(true);
    this.authStore.resendVerification(id).subscribe({
      next: () => {
        this.isResending.set(false);
        this.resendSuccess.set(true);
      },
      error: err => {
        this.isResending.set(false);
        alert(err.error?.detail || 'Failed to resend activation link.');
      }
    });
  }
}
