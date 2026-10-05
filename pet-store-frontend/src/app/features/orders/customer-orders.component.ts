import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../core/services/order.service';
import { OrderResponse, OrderStatus } from '../../core/models/order.model';
import { AuthStore } from '../../core/stores/auth.store';

@Component({
  selector: 'app-customer-orders',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, DatePipe, FormsModule],
  templateUrl: './customer-orders.component.html',
  styles: [`
    .orders-container {
      max-width: 900px;
      margin: 2rem auto;
      padding: 0 1rem;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      border-bottom: 1px solid var(--border);
      padding-bottom: 1rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .page-header h1 {
      font-size: 1.85rem;
      margin: 0;
      color: var(--primary);
    }
    .subtitle {
      color: var(--text-muted);
      margin: 0.25rem 0 0;
      font-size: 0.95rem;
    }
    .header-actions {
      display: flex;
      gap: 0.75rem;
    }
    .loading-state, .empty-state {
      text-align: center;
      padding: 4rem 1rem;
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid var(--border);
    }
    .empty-icon {
      font-size: 3.5rem;
      margin-bottom: 0.5rem;
    }
    .empty-actions {
      display: flex;
      justify-content: center;
      gap: 1rem;
      margin-top: 1.5rem;
    }
    .spinner {
      border: 3px solid rgba(0, 0, 0, 0.1);
      border-left-color: var(--primary);
      border-radius: 50%;
      width: 2.5rem;
      height: 2.5rem;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .error-banner {
      background: #fee2e2;
      color: #b91c1c;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    .orders-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .order-card {
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .order-card-header {
      background: #f8fafc;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .order-meta {
      display: flex;
      gap: 2rem;
      flex-wrap: wrap;
    }
    .label {
      display: block;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-muted);
    }
    .order-num {
      font-family: monospace;
      font-size: 0.95rem;
      color: var(--text-main);
    }
    .order-price {
      color: var(--primary);
      font-weight: 700;
    }
    .order-status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.35rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    .status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    [data-status="CONFIRMED"] {
      background: #eff6ff;
      color: #1d4ed8;
    }
    [data-status="CONFIRMED"] .status-indicator {
      background: #2563eb;
    }
    [data-status="PROCESSING"] {
      background: #fef3c7;
      color: #b45309;
    }
    [data-status="PROCESSING"] .status-indicator {
      background: #d97706;
    }
    [data-status="SHIPPED"] {
      background: #f3e8ff;
      color: #7e22ce;
    }
    [data-status="SHIPPED"] .status-indicator {
      background: #9333ea;
    }
    [data-status="DELIVERED"] {
      background: #dcfce7;
      color: #15803d;
    }
    [data-status="DELIVERED"] .status-indicator {
      background: #16a34a;
    }
    [data-status="CANCELLED"] {
      background: #fee2e2;
      color: #b91c1c;
    }
    [data-status="CANCELLED"] .status-indicator {
      background: #dc2626;
    }
    .timeline-container {
      padding: 1.5rem;
      border-bottom: 1px solid var(--border);
      background: #fafbfc;
    }
    .stepper {
      display: flex;
      align-items: center;
      justify-content: space-between;
      max-width: 600px;
      margin: 0 auto;
    }
    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.4rem;
      z-index: 1;
    }
    .step-circle {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #e2e8f0;
      color: #94a3b8;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
      font-weight: 600;
      transition: all 0.2s ease;
    }
    .step.active .step-circle {
      background: var(--primary);
      color: #ffffff;
    }
    .step.current .step-circle {
      box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.2);
    }
    .step-label {
      font-size: 0.75rem;
      color: #64748b;
      font-weight: 500;
    }
    .step.active .step-label {
      color: var(--text-main);
      font-weight: 600;
    }
    .step-line {
      flex: 1;
      height: 3px;
      background: #e2e8f0;
      margin: 0 -4px;
      margin-bottom: 1.25rem;
    }
    .step-line.active {
      background: var(--primary);
    }
    .tracking-info-banner {
      margin-top: 1.25rem;
      padding: 0.6rem 1rem;
      background: #ffffff;
      border: 1px dashed var(--border);
      border-radius: 8px;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-main);
    }
    .tracking-code {
      background: #f1f5f9;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      font-weight: 600;
      color: var(--primary);
    }
    .tracking-sep {
      color: #cbd5e1;
    }
    .cancelled-banner {
      padding: 1.25rem 1.5rem;
      background: #fff5f5;
      border-bottom: 1px solid #fed7d7;
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      color: #9b2c2c;
    }
    .cancelled-icon {
      font-size: 1.25rem;
    }
    .cancel-detail {
      margin: 0.2rem 0 0;
      font-size: 0.85rem;
      color: #742a2a;
    }
    .items-list {
      padding: 1rem 1.5rem;
    }
    .item-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 0;
      border-bottom: 1px solid #f1f5f9;
    }
    .item-row:last-child {
      border-bottom: none;
    }
    .item-img-wrap {
      width: 50px;
      height: 50px;
      border-radius: 8px;
      overflow: hidden;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .item-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .item-img-placeholder {
      font-size: 1.5rem;
    }
    .item-details {
      flex: 1;
    }
    .item-title {
      font-size: 0.95rem;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-main);
    }
    .item-badge {
      font-size: 0.65rem;
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
      background: #e2e8f0;
      color: #475569;
      font-weight: 600;
    }
    .item-badge.pet-badge {
      background: #fef3c7;
      color: #92400e;
    }
    .item-subtitle {
      margin: 0.15rem 0 0.25rem;
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .item-qty {
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .item-subtotal {
      font-weight: 600;
      font-size: 0.95rem;
      color: var(--text-main);
    }
    .order-card-footer {
      background: #f8fafc;
      padding: 0.85rem 1.5rem;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .delivery-info {
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .delivery-title {
      font-weight: 600;
      margin-right: 0.25rem;
    }
    .footer-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .payment-badge-wrap {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.8rem;
      background: #ffffff;
      border: 1px solid var(--border);
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
    }
    .card-brand {
      font-weight: 700;
      color: var(--primary);
    }
    .card-ending {
      color: var(--text-muted);
      font-family: monospace;
    }
    .payment-status-pill {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
    }
    [data-payment="PAID"] {
      background: #dcfce7;
      color: #15803d;
    }
    [data-payment="REFUNDED"] {
      background: #fee2e2;
      color: #b91c1c;
    }
    .btn-outline-danger {
      border: 1px solid #ef4444;
      color: #dc2626;
      background: transparent;
      padding: 0.3rem 0.75rem;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-outline-danger:hover {
      background: #fef2f2;
    }
    .pagination-nav {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      margin-top: 1.5rem;
    }
    .page-info {
      font-size: 0.875rem;
      color: var(--text-muted);
    }
    /* Modal Styles */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(2px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
      padding: 1rem;
    }
    .modal-card {
      background: #ffffff;
      border-radius: 12px;
      max-width: 500px;
      width: 100%;
      overflow: hidden;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }
    .modal-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .modal-header h3 {
      margin: 0;
      font-size: 1.2rem;
      color: var(--text-main);
    }
    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      line-height: 1;
      cursor: pointer;
      color: var(--text-muted);
    }
    .modal-body {
      padding: 1.5rem;
    }
    .warning-text {
      color: #b45309;
      background: #fef3c7;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-size: 0.85rem;
      margin: 0 0 1.25rem;
      line-height: 1.4;
    }
    .form-group label {
      display: block;
      font-size: 0.85rem;
      font-weight: 500;
      margin-bottom: 0.4rem;
      color: var(--text-main);
    }
    .form-control {
      width: 100%;
      padding: 0.6rem 0.75rem;
      border: 1px solid var(--border);
      border-radius: 6px;
      font-family: inherit;
      font-size: 0.9rem;
      box-sizing: border-box;
    }
    .error-inline {
      margin-top: 0.75rem;
      color: #dc2626;
      font-size: 0.85rem;
    }
    .modal-footer {
      padding: 1rem 1.5rem;
      background: #f8fafc;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }
  `]
})
export class CustomerOrdersComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  readonly authStore = inject(AuthStore);

  readonly orders = signal<OrderResponse[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);

  readonly currentPage = signal<number>(0);
  readonly totalPages = signal<number>(0);

  // Cancellation Modal State
  readonly cancellingOrder = signal<OrderResponse | null>(null);
  readonly cancellationReason = signal<string>('');
  readonly isSubmittingCancel = signal<boolean>(false);
  readonly cancelErrorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(page: number = 0): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.orderService.getCustomerOrders(page, 10).subscribe({
      next: (res) => {
        this.orders.set(res.content);
        this.currentPage.set(res.number);
        this.totalPages.set(res.totalPages);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.detail || 'Failed to load your orders.');
        this.isLoading.set(false);
      }
    });
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.loadOrders(page);
    }
  }

  openCancelModal(order: OrderResponse): void {
    this.cancellingOrder.set(order);
    this.cancellationReason.set('');
    this.cancelErrorMessage.set(null);
  }

  closeCancelModal(): void {
    this.cancellingOrder.set(null);
    this.cancellationReason.set('');
    this.cancelErrorMessage.set(null);
  }

  confirmCancellation(): void {
    const target = this.cancellingOrder();
    if (!target) return;

    this.isSubmittingCancel.set(true);
    this.cancelErrorMessage.set(null);

    this.orderService.cancelCustomerOrder(target.orderNumber, this.cancellationReason()).subscribe({
      next: (updated) => {
        this.orders.update(list => list.map(o => o.orderNumber === updated.orderNumber ? updated : o));
        this.isSubmittingCancel.set(false);
        this.closeCancelModal();
      },
      error: (err) => {
        this.cancelErrorMessage.set(err.error?.detail || 'Failed to cancel order.');
        this.isSubmittingCancel.set(false);
      }
    });
  }

  formatStatus(status: OrderStatus): string {
    switch (status) {
      case 'CONFIRMED': return 'Confirmed';
      case 'PROCESSING': return 'Processing';
      case 'SHIPPED': return 'Shipped';
      case 'DELIVERED': return 'Delivered';
      case 'CANCELLED': return 'Cancelled';
      default: return status;
    }
  }

  isStepReached(current: OrderStatus, step: OrderStatus): boolean {
    const sequence: OrderStatus[] = ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
    const currentIndex = sequence.indexOf(current);
    const stepIndex = sequence.indexOf(step);
    if (currentIndex === -1 || stepIndex === -1) return false;
    return currentIndex >= stepIndex;
  }
}
