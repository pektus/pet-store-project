import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthStore } from '../../core/stores/auth.store';
import { CartStore } from '../../core/stores/cart.store';
import { CheckoutService } from '../../core/services/checkout.service';
import { CheckoutQuote, CheckoutRequest, OrderResponse } from '../../core/models/order.model';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, FormsModule, RouterLink],
  templateUrl: './checkout.component.html',
  styles: [`
    .checkout-container {
      padding: 2rem 1rem 5rem 1rem;
    }
    .page-header {
      margin-bottom: 2rem;
    }
    .page-title {
      font-size: 2rem;
      font-weight: 800;
      color: var(--text-main);
      margin-bottom: 0.5rem;
    }
    .page-subtitle {
      font-size: 1rem;
      color: var(--text-muted);
    }
    .auth-gate-alert {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      background: #eff6ff;
      border: 1px solid #93c5fd;
      border-radius: var(--radius);
      padding: 1.25rem 1.5rem;
      margin-bottom: 2rem;
    }
    .alert-icon {
      font-size: 2rem;
    }
    .alert-body {
      flex: 1;
    }
    .alert-body h4 {
      font-size: 1.1rem;
      color: #1e3a8a;
      margin-bottom: 0.25rem;
    }
    .alert-body p {
      font-size: 0.875rem;
      color: #3b82f6;
      margin: 0;
    }
    .checkout-layout {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 2rem;
      align-items: start;
    }
    .checkout-card {
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.75rem;
      margin-bottom: 1.5rem;
      box-shadow: var(--shadow-sm);
    }
    .card-heading {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border);
    }
    .step-num {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--primary);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      font-weight: 700;
    }
    .card-heading h2 {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-main);
      margin: 0;
    }
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .full-width {
      grid-column: 1 / -1;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .form-group label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-main);
    }
    .form-control {
      padding: 0.65rem 0.875rem;
      border: 1px solid var(--border);
      border-radius: 6px;
      font-size: 0.9375rem;
      transition: border-color 0.15s ease;
    }
    .form-control:focus {
      outline: none;
      border-color: var(--primary);
    }
    .form-control.is-invalid {
      border-color: #ef4444;
      background-color: #fff5f5;
    }
    .disabled-input {
      background-color: #f1f5f9;
      cursor: not-allowed;
    }
    .field-error {
      font-size: 0.75rem;
      color: #dc2626;
      font-weight: 500;
    }
    .label-with-brand {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand-badge {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .brand-visa { background: #dbeafe; color: #1e40af; }
    .brand-mastercard { background: #fee2e2; color: #b91c1c; }
    .brand-amex { background: #dcfce7; color: #15803d; }
    .brand-discover { background: #ffedd5; color: #c2410c; }
    .brand-unknown { background: #f1f5f9; color: #64748b; }

    .sandbox-hints-box {
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 8px;
      padding: 0.75rem 1rem;
      margin-bottom: 1.25rem;
    }
    .sandbox-title {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      margin-bottom: 0.5rem;
    }
    .sandbox-btn-group {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .btn-sandbox {
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 0.25rem 0.6rem;
      font-size: 0.75rem;
      cursor: pointer;
      font-weight: 600;
      color: var(--text-main);
      transition: all 0.15s;
    }
    .btn-sandbox:hover {
      border-color: var(--primary);
      background: #f0fdf4;
    }
    .btn-sandbox-warn:hover {
      background: #fef2f2;
      border-color: #ef4444;
    }
    .pci-notice {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 1.25rem;
      padding: 0.625rem 0.875rem;
      background: #f8fafc;
      border-radius: 6px;
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .lock-icon {
      font-size: 1rem;
    }
    .order-summary-card {
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.5rem;
      box-shadow: var(--shadow-sm);
      position: sticky;
      top: 5rem;
    }
    .order-summary-card h3 {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 1.25rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border);
    }
    .summary-items {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-height: 240px;
      overflow-y: auto;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border);
      margin-bottom: 1rem;
    }
    .summary-item-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
    }
    .item-text {
      display: flex;
      flex-direction: column;
    }
    .item-text .title {
      font-weight: 600;
      color: var(--text-main);
    }
    .item-text .qty {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .cost-breakdown {
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
      margin-bottom: 1.5rem;
    }
    .cost-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
      color: var(--text-muted);
    }
    .badge-free {
      color: #16a34a;
      font-weight: 700;
    }
    .free-shipping-note {
      font-size: 0.75rem;
      color: #15803d;
      margin: -0.25rem 0 0.25rem 0;
      font-weight: 500;
    }
    .total-row {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--text-main);
      padding-top: 0.75rem;
      border-top: 1px solid var(--border);
    }
    .total-amount {
      color: var(--primary);
    }
    .btn-submit-order {
      width: 100%;
      padding: 0.875rem;
      font-size: 1rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }
    .submitting-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid #ffffff;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    .submit-note {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 0.75rem;
    }
    .alert-danger {
      background: #fee2e2;
      color: #991b1b;
      border: 1px solid #f87171;
      padding: 0.875rem 1rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.875rem;
    }
    /* Receipt Styles */
    .receipt-card {
      max-width: 760px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 2.5rem;
      box-shadow: var(--shadow-lg);
    }
    .receipt-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .success-icon {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: #dcfce7;
      color: #16a34a;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      margin: 0 auto 1rem;
    }
    .receipt-title {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--text-main);
      margin-bottom: 0.5rem;
    }
    .receipt-subtitle {
      font-size: 0.9375rem;
      color: var(--text-muted);
    }
    .order-meta-box {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 1rem;
      background: #f8fafc;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1.25rem;
      margin-bottom: 2rem;
    }
    .meta-col {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .meta-label {
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
      font-weight: 600;
    }
    .meta-val {
      font-size: 0.9375rem;
      color: var(--text-main);
    }
    .meta-val.highlight {
      font-weight: 700;
      color: var(--primary);
      font-size: 1.05rem;
    }
    .meta-val.mono {
      font-family: monospace;
      font-size: 0.8125rem;
    }
    .receipt-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      margin-bottom: 2rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid var(--border);
    }
    .receipt-section h3 {
      font-size: 1.05rem;
      font-weight: 700;
      margin-bottom: 0.875rem;
    }
    .address-box p {
      margin: 0 0 0.25rem 0;
      font-size: 0.875rem;
      color: var(--text-main);
    }
    .receipt-items-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1.25rem;
    }
    .receipt-item-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px dashed var(--border);
    }
    .receipt-item-info {
      display: flex;
      flex-direction: column;
    }
    .item-sub {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .item-qty {
      font-size: 0.75rem;
      color: #64748b;
    }
    .receipt-totals {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .receipt-totals .total-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
    }
    .receipt-totals .grand-total {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--text-main);
      padding-top: 0.5rem;
      border-top: 1px solid var(--border);
    }
    .receipt-actions {
      text-align: center;
    }
    .empty-cart-card {
      text-align: center;
      padding: 4rem 1rem;
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: var(--radius);
    }
    .empty-cart-card .empty-icon {
      font-size: 3.5rem;
      margin-bottom: 1rem;
      opacity: 0.6;
    }
    @media (max-width: 768px) {
      .checkout-layout {
        grid-template-columns: 1fr;
      }
      .receipt-grid {
        grid-template-columns: 1fr;
      }
      .form-grid {
        grid-template-columns: 1fr;
      }
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class CheckoutComponent implements OnInit {
  readonly authStore = inject(AuthStore);
  readonly cartStore = inject(CartStore);
  private readonly checkoutService = inject(CheckoutService);
  private readonly router = inject(Router);

  // Shipping Address Form State
  readonly recipientName = signal<string>('');
  readonly recipientPhone = signal<string>('');
  readonly shippingAddress1 = signal<string>('');
  readonly shippingAddress2 = signal<string>('');
  readonly shippingCity = signal<string>('');
  readonly shippingState = signal<string>('');
  readonly shippingPostalCode = signal<string>('');

  // Payment Form State
  readonly cardholderName = signal<string>('');
  readonly cardNumber = signal<string>('');
  readonly expiryMonth = signal<string>('');
  readonly expiryYear = signal<string>('');
  readonly cvv = signal<string>('');

  // Status signals
  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly completedOrder = signal<OrderResponse | null>(null);

  // Pricing & Computations
  readonly computedSubtotal = computed(() => this.cartStore.totalPrice());
  readonly hasPet = computed(() => this.cartStore.items().some(i => i.itemType === 'PET'));
  readonly isFreeShipping = computed(() => this.computedSubtotal() >= 75 || this.hasPet() || this.cartStore.totalCount() === 0);
  readonly computedShipping = computed(() => this.isFreeShipping() ? 0 : 9.99);
  readonly computedTax = computed(() => +(this.computedSubtotal() * 0.08).toFixed(2));
  readonly computedTotal = computed(() => +(this.computedSubtotal() + this.computedShipping() + this.computedTax()).toFixed(2));

  // Payment Form Computed Validations
  readonly cleanedCardNumber = computed(() => (this.cardNumber() ?? '').replace(/\D/g, ''));
  readonly detectedBrand = computed(() => this.detectCardBrand(this.cleanedCardNumber()));

  readonly isCardValid = computed(() => {
    const cleaned = this.cleanedCardNumber();
    if (cleaned.length < 13 || cleaned.length > 19) return false;
    return this.checkLuhn(cleaned);
  });

  readonly isExpiryValid = computed(() => {
    const m = parseInt(this.expiryMonth(), 10);
    const y = parseInt(this.expiryYear(), 10);
    if (isNaN(m) || isNaN(y) || m < 1 || m > 12) return false;
    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;
    if (y < currentYear) return false;
    if (y === currentYear && m < currentMonth) return false;
    return true;
  });

  readonly isCvvValid = computed(() => {
    const c = this.cvv().trim();
    if (this.detectedBrand() === 'AMEX') {
      return /^[0-9]{4}$/.test(c);
    }
    return /^[0-9]{3,4}$/.test(c);
  });

  readonly isFormValid = computed(() => {
    return !!(
      this.recipientName().trim() &&
      this.recipientPhone().trim() &&
      this.shippingAddress1().trim() &&
      this.shippingCity().trim() &&
      this.shippingState().trim() &&
      this.shippingPostalCode().trim() &&
      this.cardholderName().trim() &&
      this.isCardValid() &&
      this.isExpiryValid() &&
      this.isCvvValid()
    );
  });

  ngOnInit(): void {
    const currentUser = this.authStore.currentUser();
    if (currentUser) {
      if (currentUser.fullName) {
        this.recipientName.set(currentUser.fullName);
        this.cardholderName.set(currentUser.fullName);
      }
      if (currentUser.phone) {
        this.recipientPhone.set(currentUser.phone);
      }
    }
  }

  onCardNumberChange(val: string): void {
    const cleaned = (val ?? '').replace(/\D/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') ?? cleaned;
    this.cardNumber.set(formatted);
  }

  fillTestCard(type: 'visa' | 'mastercard' | 'decline_funds' | 'decline_fraud'): void {
    switch (type) {
      case 'visa':
        this.cardNumber.set('4000 0012 3456 7899');
        this.cardholderName.set('Jane Doe');
        this.expiryMonth.set('12');
        this.expiryYear.set('30');
        this.cvv.set('123');
        break;
      case 'mastercard':
        this.cardNumber.set('5105 1051 0510 5100');
        this.cardholderName.set('John Smith');
        this.expiryMonth.set('08');
        this.expiryYear.set('29');
        this.cvv.set('456');
        break;
      case 'decline_funds':
        this.cardNumber.set('4000 0000 0000 0002');
        this.cardholderName.set('Jane LowFunds');
        this.expiryMonth.set('12');
        this.expiryYear.set('30');
        this.cvv.set('123');
        break;
      case 'decline_fraud':
        this.cardNumber.set('4000 0000 0000 0005');
        this.cardholderName.set('Suspect Fraud');
        this.expiryMonth.set('12');
        this.expiryYear.set('30');
        this.cvv.set('123');
        break;
    }
  }

  submitOrder(): void {
    if (!this.isFormValid() || !this.authStore.isAuthenticated()) {
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const payload: CheckoutRequest = {
      recipientName: this.recipientName().trim(),
      recipientPhone: this.recipientPhone().trim(),
      shippingAddressLine1: this.shippingAddress1().trim(),
      shippingAddressLine2: this.shippingAddress2().trim() || undefined,
      shippingCity: this.shippingCity().trim(),
      shippingState: this.shippingState().trim(),
      shippingPostalCode: this.shippingPostalCode().trim(),
      shippingCountry: 'United States',
      payment: {
        cardholderName: this.cardholderName().trim(),
        cardNumber: this.cleanedCardNumber(),
        expiryMonth: this.expiryMonth().trim(),
        expiryYear: this.expiryYear().trim(),
        cvv: this.cvv().trim()
      }
    };

    this.checkoutService.processCheckout(payload).subscribe({
      next: (order: OrderResponse) => {
        this.isSubmitting.set(false);
        this.completedOrder.set(order);
        this.cartStore.clearCart();
      },
      error: err => {
        this.isSubmitting.set(false);
        const msg = err.error?.detail || err.error?.message || 'Failed to complete checkout and authorize payment.';
        this.errorMessage.set(msg);
      }
    });
  }

  returnToCatalog(): void {
    this.router.navigate(['/']);
  }

  private detectCardBrand(card: string): string {
    if (!card) return 'UNKNOWN';
    if (card.startsWith('4')) return 'VISA';
    if (card.startsWith('34') || card.startsWith('37')) return 'AMEX';
    if (card.startsWith('6011') || card.startsWith('65')) return 'DISCOVER';
    const prefix2 = parseInt(card.substring(0, 2), 10);
    if (prefix2 >= 51 && prefix2 <= 55) return 'MASTERCARD';
    const prefix4 = parseInt(card.substring(0, 4), 10);
    if (prefix4 >= 2221 && prefix4 <= 2720) return 'MASTERCARD';
    return 'UNKNOWN';
  }

  private checkLuhn(card: string): boolean {
    let sum = 0;
    let alternate = false;
    for (let i = card.length - 1; i >= 0; i--) {
      let n = parseInt(card.charAt(i), 10);
      if (alternate) {
        n *= 2;
        if (n > 9) n = (n % 10) + 1;
      }
      sum += n;
      alternate = !alternate;
    }
    return sum % 10 === 0;
  }
}
