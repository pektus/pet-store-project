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
  template: `
    <div class="admin-orders-container">
      <header class="admin-header">
        <div>
          <h1>Order Fulfillment Dashboard</h1>
          <p class="subtitle">Review customer orders, transition fulfillment stages, and monitor deliveries.</p>
        </div>
        <div class="header-links">
          <a routerLink="/admin/inventory" class="btn btn-outline btn-sm">&#128230; Inventory Management</a>
        </div>
      </header>

      <!-- Filter & Search Toolbar (Signal Forms) -->
      <div class="filter-card">
        <form class="filter-form" (submit)="$event.preventDefault(); applyFilter()">
          <div class="search-input-wrap">
            <input 
              type="text" 
              class="form-control" 
              placeholder="Search by Order #, Customer, Recipient, or Tracking..." 
              [ngModel]="searchQuery()" 
              (ngModelChange)="searchQuery.set($event)"
              name="searchQuery" />
          </div>

          <div class="status-select-wrap">
            <select 
              class="form-control" 
              [ngModel]="statusFilter()" 
              (ngModelChange)="onStatusChange($event)"
              name="statusFilter">
              <option value="ALL">All Statuses</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PROCESSING">Processing</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div class="filter-actions">
            <button type="submit" class="btn btn-primary btn-sm">Filter</button>
            <button type="button" class="btn btn-outline btn-sm" (click)="resetFilter()">Reset</button>
          </div>
        </form>
      </div>

      <!-- Table Section -->
      @if (isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading orders...</p>
        </div>
      } @else if (errorMessage()) {
        <div class="error-banner">
          <span>&#9888; {{ errorMessage() }}</span>
          <button class="btn btn-outline btn-sm" (click)="loadOrders()">Retry</button>
        </div>
      } @else if (orders().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">&#128221;</div>
          <h3>No orders match your filter</h3>
          <p>Try modifying your search query or status criteria.</p>
          <button class="btn btn-outline btn-sm" (click)="resetFilter()">Clear Filters</button>
        </div>
      } @else {
        <div class="table-card">
          <table class="orders-table">
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Date</th>
                <th>Recipient / Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Fulfillment Tracking</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (order of orders(); track order.orderNumber) {
                <tr [class.cancelled-row]="order.status === 'CANCELLED'">
                  <td class="order-num-col">
                    <button class="link-btn" (click)="inspectOrder(order)">
                      <strong>{{ order.orderNumber }}</strong>
                    </button>
                  </td>
                  <td class="date-col">
                    {{ order.createdAt | date:'short' }}
                  </td>
                  <td>
                    <div class="recipient-name">{{ order.recipientName }}</div>
                    <div class="recipient-address">{{ order.shippingCity }}, {{ order.shippingState }}</div>
                  </td>
                  <td>
                    <span class="badge-count">{{ order.items.length }} item(s)</span>
                  </td>
                  <td class="total-col">
                    <strong>{{ order.totalAmount | currency }}</strong>
                    <span class="payment-tag" [attr.data-pay]="order.paymentStatus">{{ order.paymentStatus }}</span>
                  </td>
                  <td>
                    <span class="status-badge" [attr.data-status]="order.status">
                      {{ order.status }}
                    </span>
                  </td>
                  <td>
                    @if (order.trackingNumber) {
                      <div class="tracking-snippet">
                        <span class="carrier-tag">{{ order.carrier || 'Courier' }}</span>
                        <code>{{ order.trackingNumber }}</code>
                      </div>
                    } @else if (order.status === 'CANCELLED') {
                      <span class="text-muted text-sm">&#10006; Cancelled</span>
                    } @else {
                      <span class="text-muted text-sm">Not assigned</span>
                    }
                  </td>
                  <td class="actions-col text-right">
                    <div class="btn-group">
                      <button class="btn btn-outline btn-xs" (click)="inspectOrder(order)">
                        View
                      </button>

                      @if (order.status === 'CONFIRMED') {
                        <button class="btn btn-warning btn-xs" (click)="openStatusModal(order, 'PROCESSING')">
                          Process
                        </button>
                      } @else if (order.status === 'PROCESSING') {
                        <button class="btn btn-purple btn-xs" (click)="openStatusModal(order, 'SHIPPED')">
                          Ship
                        </button>
                      } @else if (order.status === 'SHIPPED') {
                        <button class="btn btn-success btn-xs" (click)="openStatusModal(order, 'DELIVERED')">
                          Deliver
                        </button>
                      }

                      @if (order.status !== 'CANCELLED' && order.status !== 'DELIVERED') {
                        <button class="btn btn-outline-danger btn-xs" (click)="openStatusModal(order, 'CANCELLED')">
                          Cancel
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>

          <!-- Pagination -->
          @if (totalPages() > 1) {
            <div class="table-pagination">
              <span class="page-meta">Showing page {{ currentPage() + 1 }} of {{ totalPages() }} ({{ totalElements() }} orders)</span>
              <div class="pagination-buttons">
                <button 
                  class="btn btn-outline btn-sm" 
                  [disabled]="currentPage() === 0" 
                  (click)="goToPage(currentPage() - 1)">
                  &larr; Prev
                </button>
                <button 
                  class="btn btn-outline btn-sm" 
                  [disabled]="currentPage() >= totalPages() - 1" 
                  (click)="goToPage(currentPage() + 1)">
                  Next &rarr;
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- Order Detail Modal -->
      @if (viewingOrder()) {
        <div class="modal-backdrop" (click)="closeInspectModal()">
          <div class="modal-card modal-lg" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Order Details: {{ viewingOrder()?.orderNumber }}</h3>
              <button class="close-btn" (click)="closeInspectModal()">&times;</button>
            </div>
            <div class="modal-body">
              <div class="detail-grid">
                <div class="detail-block">
                  <h4>Customer & Shipping</h4>
                  <p><strong>Recipient:</strong> {{ viewingOrder()?.recipientName }}</p>
                  <p><strong>Phone:</strong> {{ viewingOrder()?.recipientPhone }}</p>
                  <p><strong>Address:</strong> {{ viewingOrder()?.shippingAddressLine1 }} {{ viewingOrder()?.shippingAddressLine2 }}</p>
                  <p><strong>City/State/Zip:</strong> {{ viewingOrder()?.shippingCity }}, {{ viewingOrder()?.shippingState }} {{ viewingOrder()?.shippingPostalCode }}</p>
                  <p><strong>Country:</strong> {{ viewingOrder()?.shippingCountry }}</p>
                </div>
                <div class="detail-block">
                  <h4>Financial & Fulfillment</h4>
                  <p><strong>Status:</strong> <span class="status-badge" [attr.data-status]="viewingOrder()?.status">{{ viewingOrder()?.status }}</span></p>
                  <p><strong>Payment Status:</strong> {{ viewingOrder()?.paymentStatus }} ({{ viewingOrder()?.cardBrand }} &bull;&bull;&bull;&bull; {{ viewingOrder()?.cardLastFour }})</p>
                  <p><strong>Subtotal:</strong> {{ viewingOrder()?.subtotal | currency }}</p>
                  <p><strong>Shipping:</strong> {{ viewingOrder()?.shippingAmount | currency }}</p>
                  <p><strong>Tax:</strong> {{ viewingOrder()?.taxAmount | currency }}</p>
                  <p><strong>Total Amount:</strong> <strong class="text-primary">{{ viewingOrder()?.totalAmount | currency }}</strong></p>
                  @if (viewingOrder()?.carrier) {
                    <p><strong>Carrier:</strong> {{ viewingOrder()?.carrier }}</p>
                  }
                  @if (viewingOrder()?.trackingNumber) {
                    <p><strong>Tracking Number:</strong> <code>{{ viewingOrder()?.trackingNumber }}</code></p>
                  }
                  @if (viewingOrder()?.cancellationReason) {
                    <p class="text-danger"><strong>Cancellation Reason:</strong> {{ viewingOrder()?.cancellationReason }}</p>
                  }
                </div>
              </div>

              <h4>Items Snapshot</h4>
              <table class="detail-items-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Type</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th class="text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of viewingOrder()?.items; track item.id) {
                    <tr>
                      <td>
                        <strong>{{ item.title }}</strong>
                        @if (item.subtitle) {
                          <div class="text-muted text-xs">{{ item.subtitle }}</div>
                        }
                      </td>
                      <td><span class="badge-type">{{ item.itemType }}</span></td>
                      <td>{{ item.unitPrice | currency }}</td>
                      <td>{{ item.quantity }}</td>
                      <td class="text-right">{{ item.subtotal | currency }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeInspectModal()">Close</button>
            </div>
          </div>
        </div>
      }

      <!-- Status Transition Modal -->
      @if (transitionOrder()) {
        <div class="modal-backdrop" (click)="closeStatusModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Transition Order to {{ targetStatus() }}</h3>
              <button class="close-btn" (click)="closeStatusModal()">&times;</button>
            </div>
            <div class="modal-body">
              <p>Updating Order <strong>{{ transitionOrder()?.orderNumber }}</strong> from <code>{{ transitionOrder()?.status }}</code> to <code>{{ targetStatus() }}</code>.</p>

              @if (targetStatus() === 'SHIPPED') {
                <div class="form-group">
                  <label for="carrierInput">Shipping Carrier:</label>
                  <select 
                    id="carrierInput" 
                    class="form-control"
                    [ngModel]="carrierInput()"
                    (ngModelChange)="carrierInput.set($event)">
                    <option value="FedEx">FedEx</option>
                    <option value="UPS">UPS</option>
                    <option value="USPS">USPS</option>
                    <option value="DHL">DHL</option>
                    <option value="Local Pet Courier">Local Pet Courier</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="trackingInput">Tracking Number:</label>
                  <input 
                    type="text" 
                    id="trackingInput" 
                    class="form-control" 
                    placeholder="e.g. FX-928471928"
                    [ngModel]="trackingInput()"
                    (ngModelChange)="trackingInput.set($event)" />
                </div>
              }

              @if (targetStatus() === 'CANCELLED') {
                <div class="warning-text">
                  &#9888; Cancelling this order will automatically restore pet availability (<code>AVAILABLE</code>), restock physical supplies, and mark payment as <code>REFUNDED</code>.
                </div>
                <div class="form-group">
                  <label for="cancellationReasonInput">Reason for Cancellation:</label>
                  <textarea 
                    id="cancellationReasonInput" 
                    rows="3" 
                    class="form-control" 
                    placeholder="e.g. Stock damage, customer phone request..."
                    [ngModel]="cancellationReasonInput()"
                    (ngModelChange)="cancellationReasonInput.set($event)">
                  </textarea>
                </div>
              }

              @if (actionErrorMessage()) {
                <div class="error-inline">{{ actionErrorMessage() }}</div>
              }
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" [disabled]="isSubmittingAction()" (click)="closeStatusModal()">
                Cancel
              </button>
              <button 
                class="btn" 
                [class.btn-danger]="targetStatus() === 'CANCELLED'"
                [class.btn-primary]="targetStatus() !== 'CANCELLED'"
                [disabled]="isSubmittingAction()" 
                (click)="confirmStatusTransition()">
                @if (isSubmittingAction()) {
                  <span>Updating...</span>
                } @else {
                  <span>Confirm Status Change</span>
                }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
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
