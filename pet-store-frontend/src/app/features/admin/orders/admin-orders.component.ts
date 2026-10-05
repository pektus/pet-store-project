import { Component, OnInit, inject, model, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { OrderResponse, OrderStatus, OrderStatusUpdateRequest } from '../../../core/models/order.model';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, DatePipe, FormsModule],
  templateUrl: './admin-orders.component.html',
  styles: [`
    .admin-orders-container {
      max-width: 1200px;
      margin: 2rem auto;
      padding: 0 1rem;
    }
    .admin-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid var(--border);
      padding-bottom: 1rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .admin-header h1 {
      font-size: 1.85rem;
      margin: 0;
      color: var(--primary);
    }
    .subtitle {
      color: var(--text-muted);
      margin: 0.25rem 0 0;
      font-size: 0.95rem;
    }
    .filter-card {
      background: #ffffff;
      padding: 1rem 1.25rem;
      border: 1px solid var(--border);
      border-radius: 10px;
      margin-bottom: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
    }
    .filter-form {
      display: flex;
      gap: 1rem;
      align-items: center;
      flex-wrap: wrap;
    }
    .search-input-wrap {
      flex: 1;
      min-width: 250px;
    }
    .status-select-wrap {
      width: 180px;
    }
    .filter-actions {
      display: flex;
      gap: 0.5rem;
    }
    .form-control {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--border);
      border-radius: 6px;
      font-family: inherit;
      font-size: 0.9rem;
      box-sizing: border-box;
    }
    .table-card {
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: 10px;
      overflow-x: auto;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
    }
    .orders-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.875rem;
    }
    .orders-table th {
      background: #f8fafc;
      padding: 0.75rem 1rem;
      font-weight: 600;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border);
      white-space: nowrap;
    }
    .orders-table td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    .orders-table tr:hover {
      background: #fafbfc;
    }
    .cancelled-row {
      background: #fff8f8;
      opacity: 0.85;
    }
    .order-num-col code, .order-num-col strong {
      font-family: monospace;
      color: var(--primary);
    }
    .link-btn {
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;
      text-decoration: underline;
    }
    .date-col {
      color: var(--text-muted);
      white-space: nowrap;
      font-size: 0.8rem;
    }
    .recipient-name {
      font-weight: 500;
      color: var(--text-main);
    }
    .recipient-address {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .badge-count {
      background: #f1f5f9;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      font-size: 0.75rem;
    }
    .total-col {
      white-space: nowrap;
    }
    .payment-tag {
      display: block;
      font-size: 0.65rem;
      font-weight: 700;
    }
    [data-pay="PAID"] {
      color: #15803d;
    }
    [data-pay="REFUNDED"] {
      color: #b91c1c;
    }
    .status-badge {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      white-space: nowrap;
    }
    [data-status="CONFIRMED"] {
      background: #eff6ff;
      color: #1d4ed8;
    }
    [data-status="PROCESSING"] {
      background: #fef3c7;
      color: #b45309;
    }
    [data-status="SHIPPED"] {
      background: #f3e8ff;
      color: #7e22ce;
    }
    [data-status="DELIVERED"] {
      background: #dcfce7;
      color: #15803d;
    }
    [data-status="CANCELLED"] {
      background: #fee2e2;
      color: #b91c1c;
    }
    .tracking-snippet {
      font-size: 0.8rem;
    }
    .carrier-tag {
      font-weight: 600;
      margin-right: 0.3rem;
      color: var(--text-muted);
    }
    .btn-group {
      display: flex;
      gap: 0.35rem;
      justify-content: flex-end;
    }
    .btn-xs {
      padding: 0.2rem 0.5rem;
      font-size: 0.75rem;
      border-radius: 4px;
      cursor: pointer;
    }
    .btn-warning {
      background: #f59e0b;
      color: #ffffff;
      border: 1px solid #d97706;
    }
    .btn-warning:hover {
      background: #d97706;
    }
    .btn-purple {
      background: #8b5cf6;
      color: #ffffff;
      border: 1px solid #7c3aed;
    }
    .btn-purple:hover {
      background: #7c3aed;
    }
    .btn-success {
      background: #10b981;
      color: #ffffff;
      border: 1px solid #059669;
    }
    .btn-success:hover {
      background: #059669;
    }
    .btn-outline-danger {
      border: 1px solid #ef4444;
      color: #dc2626;
      background: transparent;
    }
    .btn-outline-danger:hover {
      background: #fef2f2;
    }
    .table-pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      background: #f8fafc;
      border-top: 1px solid var(--border);
    }
    .page-meta {
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .pagination-buttons {
      display: flex;
      gap: 0.5rem;
    }
    .text-right {
      text-align: right;
    }
    .loading-state, .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      background: #ffffff;
      border-radius: 10px;
      border: 1px solid var(--border);
    }
    .spinner {
      border: 3px solid rgba(0, 0, 0, 0.1);
      border-left-color: var(--primary);
      border-radius: 50%;
      width: 2rem;
      height: 2rem;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 0.75rem;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .error-banner {
      background: #fee2e2;
      color: #b91c1c;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
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
    .modal-lg {
      max-width: 750px;
    }
    .modal-header {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .modal-header h3 {
      margin: 0;
      font-size: 1.15rem;
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
      max-height: 80vh;
      overflow-y: auto;
    }
    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .detail-block h4 {
      margin: 0 0 0.5rem;
      font-size: 0.95rem;
      color: var(--primary);
      border-bottom: 1px solid var(--border);
      padding-bottom: 0.25rem;
    }
    .detail-block p {
      margin: 0.25rem 0;
      font-size: 0.85rem;
    }
    .detail-items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
      margin-top: 0.5rem;
    }
    .detail-items-table th, .detail-items-table td {
      padding: 0.5rem 0.75rem;
      border-bottom: 1px solid #f1f5f9;
    }
    .badge-type {
      font-size: 0.7rem;
      background: #e2e8f0;
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
    }
    .modal-footer {
      padding: 0.75rem 1.5rem;
      background: #f8fafc;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }
    .form-group {
      margin-bottom: 1rem;
    }
    .form-group label {
      display: block;
      font-size: 0.85rem;
      font-weight: 500;
      margin-bottom: 0.35rem;
    }
    .warning-text {
      color: #991b1b;
      background: #fee2e2;
      padding: 0.75rem;
      border-radius: 6px;
      font-size: 0.85rem;
      margin-bottom: 1rem;
      line-height: 1.4;
    }
    .error-inline {
      color: #dc2626;
      font-size: 0.85rem;
      margin-top: 0.5rem;
    }
    .text-primary {
      color: var(--primary);
    }
    .text-danger {
      color: #dc2626;
    }
    .text-xs {
      font-size: 0.75rem;
    }
  `]
})
export class AdminOrdersComponent implements OnInit {
  private readonly orderService = inject(OrderService);

  readonly searchQuery = model<string>('');
  readonly statusFilter = model<OrderStatus | 'ALL'>('ALL');

  readonly orders = signal<OrderResponse[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);

  readonly currentPage = signal<number>(0);
  readonly totalPages = signal<number>(0);
  readonly totalElements = signal<number>(0);

  // Detail Modal
  readonly viewingOrder = signal<OrderResponse | null>(null);

  // Transition Modal State (Signal Forms)
  readonly transitionOrder = signal<OrderResponse | null>(null);
  readonly targetStatus = signal<OrderStatus>('PROCESSING');
  readonly carrierInput = model<string>('FedEx');
  readonly trackingInput = model<string>('');
  readonly cancellationReasonInput = model<string>('');
  readonly isSubmittingAction = signal<boolean>(false);
  readonly actionErrorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(page: number = 0): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.orderService.getAdminOrders(
      this.searchQuery(),
      this.statusFilter(),
      page,
      10
    ).subscribe({
      next: (res) => {
        this.orders.set(res.content);
        this.currentPage.set(res.number);
        this.totalPages.set(res.totalPages);
        this.totalElements.set(res.totalElements);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.detail || 'Failed to load orders.');
        this.isLoading.set(false);
      }
    });
  }

  applyFilter(): void {
    this.loadOrders(0);
  }

  onStatusChange(val: string): void {
    this.statusFilter.set(val as OrderStatus | 'ALL');
    this.loadOrders(0);
  }

  resetFilter(): void {
    this.searchQuery.set('');
    this.statusFilter.set('ALL');
    this.loadOrders(0);
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.loadOrders(page);
    }
  }

  inspectOrder(order: OrderResponse): void {
    this.viewingOrder.set(order);
  }

  closeInspectModal(): void {
    this.viewingOrder.set(null);
  }

  openStatusModal(order: OrderResponse, target: OrderStatus): void {
    this.transitionOrder.set(order);
    this.targetStatus.set(target);
    this.carrierInput.set(order.carrier || 'FedEx');
    this.trackingInput.set(order.trackingNumber || '');
    this.cancellationReasonInput.set('');
    this.actionErrorMessage.set(null);
  }

  closeStatusModal(): void {
    this.transitionOrder.set(null);
    this.actionErrorMessage.set(null);
  }

  confirmStatusTransition(): void {
    const order = this.transitionOrder();
    if (!order) return;

    this.isSubmittingAction.set(true);
    this.actionErrorMessage.set(null);

    const payload: OrderStatusUpdateRequest = {
      status: this.targetStatus(),
      carrier: this.targetStatus() === 'SHIPPED' ? this.carrierInput() : null,
      trackingNumber: this.targetStatus() === 'SHIPPED' ? this.trackingInput() : null,
      cancellationReason: this.targetStatus() === 'CANCELLED' ? this.cancellationReasonInput() : null
    };

    this.orderService.updateOrderStatus(order.orderNumber, payload).subscribe({
      next: (updated) => {
        this.orders.update(list => list.map(o => o.orderNumber === updated.orderNumber ? updated : o));
        this.isSubmittingAction.set(false);
        this.closeStatusModal();
      },
      error: (err) => {
        this.actionErrorMessage.set(err.error?.detail || 'Failed to update order status.');
        this.isSubmittingAction.set(false);
      }
    });
  }
}
