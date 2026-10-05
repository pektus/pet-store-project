import { Component, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { CartStore } from '../../core/stores/cart.store';
import { CartItem } from '../../core/models/cart.model';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  template: `
    @if (cartStore.isDrawerOpen()) {
      <div class="drawer-overlay" (click)="cartStore.closeDrawer()">
        <div class="drawer-panel" (click)="$event.stopPropagation()">
          
          <!-- Drawer Header -->
          <div class="drawer-header">
            <div class="header-title">
              <span class="cart-icon">&#128722;</span>
              <h3>Shopping Cart</h3>
              <span class="items-badge">{{ cartStore.totalCount() }}</span>
            </div>
            <button class="close-btn" (click)="cartStore.closeDrawer()" aria-label="Close cart">&times;</button>
          </div>

          <!-- Drawer Body -->
          <div class="drawer-body">
            @if (cartStore.error()) {
              <div class="alert alert-danger">
                {{ cartStore.error() }}
              </div>
            }

            @if (cartStore.items().length === 0) {
              <div class="empty-cart">
                <div class="empty-icon">&#128062;</div>
                <h4>Your cart is empty</h4>
                <p>Browse our catalog to find pets looking for a home or high-quality pet supplies!</p>
                <button class="btn btn-primary" (click)="browseCatalog()">Browse Catalog</button>
              </div>
            } @else {
              <div class="items-list">
                @for (item of cartStore.items(); track item.id) {
                  <div class="cart-item-card" [class.item-unavailable]="!item.isAvailable">
                    <div class="item-thumbnail">
                      @if (item.photoUrl) {
                        <img [src]="item.photoUrl" [alt]="item.title" />
                      } @else {
                        <div class="thumb-placeholder">
                          {{ item.itemType === 'PET' ? '&#128054;' : '&#128230;' }}
                        </div>
                      }
                    </div>

                    <div class="item-details">
                      <div class="item-head">
                        <h4 class="item-title">{{ item.title }}</h4>
                        <button class="remove-btn" 
                                (click)="cartStore.removeItem(item.id)" 
                                [disabled]="cartStore.updatingItemId() === item.id"
                                title="Remove item">&times;</button>
                      </div>

                      @if (item.subtitle) {
                        <p class="item-subtitle">{{ item.subtitle }}</p>
                      }

                      @if (!item.isAvailable) {
                        <div class="item-status-warning">
                          <span class="warning-icon">&#9888;</span>
                          {{ item.availabilityMessage || 'Item is currently unavailable' }}
                        </div>
                      }

                      <div class="item-footer">
                        <div class="item-price">
                          {{ item.unitPrice | currency }}
                        </div>

                        <!-- Stepper / Quantity -->
                        <div class="item-quantity-ctrl">
                          @if (item.itemType === 'PET') {
                            <span class="pet-qty-badge">Qty: 1 (Single)</span>
                          } @else {
                            <div class="stepper">
                              <button class="stepper-btn" 
                                      (click)="decrementSupply(item)" 
                                      [disabled]="cartStore.updatingItemId() === item.id || item.quantity <= 1">
                                &minus;
                              </button>
                              <span class="stepper-value">{{ item.quantity }}</span>
                              <button class="stepper-btn" 
                                      (click)="incrementSupply(item)" 
                                      [disabled]="cartStore.updatingItemId() === item.id || isMaxStockReached(item)">
                                &plus;
                              </button>
                            </div>
                          }
                        </div>

                        <div class="item-subtotal">
                          {{ item.subtotal | currency }}
                        </div>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Drawer Footer -->
          @if (cartStore.items().length > 0) {
            <div class="drawer-footer">
              @if (cartStore.hasUnavailableItems()) {
                <div class="alert alert-warning">
                  &#9888; Some items in your cart are no longer available. Please remove them before checkout.
                </div>
              }

              <div class="summary-row">
                <span class="summary-label">Total Items:</span>
                <span class="summary-val">{{ cartStore.totalCount() }}</span>
              </div>

              <div class="summary-row total-row">
                <span class="summary-label">Estimated Total:</span>
                <span class="summary-price">{{ cartStore.totalPrice() | currency }}</span>
              </div>

              <div class="footer-actions">
                <button class="btn btn-secondary btn-sm" 
                        (click)="cartStore.clearCart()" 
                        [disabled]="cartStore.loading()">
                  Clear Cart
                </button>
                <button class="btn btn-primary btn-checkout" 
                        [disabled]="!cartStore.canCheckout() || cartStore.loading()"
                        (click)="proceedToCheckout()">
                  Proceed to Checkout
                </button>
              </div>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .drawer-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.45);
      z-index: 1000;
      display: flex;
      justify-content: flex-end;
      animation: fadeIn 0.2s ease-out;
    }

    .drawer-panel {
      width: 100%;
      max-width: 440px;
      height: 100%;
      background: #ffffff;
      box-shadow: -4px 0 25px rgba(0, 0, 0, 0.15);
      display: flex;
      flex-direction: column;
      animation: slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .drawer-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #f8fafc;
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .header-title h3 {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--text-main);
      margin: 0;
    }

    .items-badge {
      background: var(--primary);
      color: #ffffff;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.15rem 0.5rem;
      border-radius: 9999px;
    }

    .close-btn {
      background: transparent;
      border: none;
      font-size: 1.75rem;
      line-height: 1;
      color: var(--text-muted);
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 4px;
      transition: color 0.15s;
    }
    .close-btn:hover {
      color: var(--text-main);
    }

    .drawer-body {
      flex: 1;
      overflow-y: auto;
      padding: 1.25rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .empty-cart {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 2rem 1rem;
      color: var(--text-muted);
    }

    .empty-icon {
      font-size: 3.5rem;
      margin-bottom: 1rem;
      opacity: 0.7;
    }

    .empty-cart h4 {
      font-size: 1.125rem;
      color: var(--text-main);
      margin-bottom: 0.5rem;
    }

    .empty-cart p {
      font-size: 0.875rem;
      margin-bottom: 1.5rem;
      max-width: 280px;
    }

    .items-list {
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
    }

    .cart-item-card {
      display: flex;
      gap: 0.875rem;
      padding: 0.875rem;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: #ffffff;
      transition: border-color 0.15s ease;
    }

    .cart-item-card.item-unavailable {
      border-color: #fca5a5;
      background-color: #fffaf0;
    }

    .item-thumbnail {
      width: 64px;
      height: 64px;
      border-radius: 6px;
      overflow: hidden;
      flex-shrink: 0;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .item-thumbnail img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .thumb-placeholder {
      font-size: 1.75rem;
    }

    .item-details {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .item-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .item-title {
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--text-main);
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .remove-btn {
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 1.25rem;
      line-height: 1;
      cursor: pointer;
      padding: 0 0.25rem;
    }
    .remove-btn:hover {
      color: #ef4444;
    }

    .item-subtitle {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin: 0;
    }

    .item-status-warning {
      font-size: 0.75rem;
      color: #b91c1c;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.25rem;
      margin-top: 0.25rem;
    }

    .item-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 0.5rem;
      padding-top: 0.35rem;
      border-top: 1px dashed var(--border);
    }

    .item-price {
      font-size: 0.8125rem;
      color: var(--text-muted);
    }

    .pet-qty-badge {
      font-size: 0.7rem;
      background: #e2e8f0;
      color: #475569;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      font-weight: 600;
    }

    .stepper {
      display: flex;
      align-items: center;
      border: 1px solid var(--border);
      border-radius: 4px;
      overflow: hidden;
    }

    .stepper-btn {
      background: #f8fafc;
      border: none;
      padding: 0.15rem 0.5rem;
      font-size: 0.875rem;
      cursor: pointer;
      color: var(--text-main);
      transition: background 0.1s;
    }
    .stepper-btn:hover:not(:disabled) {
      background: #e2e8f0;
    }
    .stepper-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .stepper-value {
      font-size: 0.8125rem;
      font-weight: 600;
      padding: 0 0.5rem;
      min-width: 1.5rem;
      text-align: center;
    }

    .item-subtotal {
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--primary);
    }

    .drawer-footer {
      padding: 1.25rem 1.5rem;
      border-top: 1px solid var(--border);
      background: #f8fafc;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    .total-row {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--text-main);
      padding-top: 0.5rem;
      border-top: 1px solid var(--border);
    }

    .summary-price {
      color: var(--primary);
    }

    .footer-actions {
      display: flex;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }

    .btn-checkout {
      flex: 1;
      padding: 0.75rem;
      font-size: 0.9375rem;
      font-weight: 600;
    }

    .alert {
      padding: 0.625rem 0.875rem;
      border-radius: 6px;
      font-size: 0.8125rem;
    }
    .alert-danger {
      background: #fee2e2;
      color: #991b1b;
      border: 1px solid #f87171;
    }
    .alert-warning {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fcd34d;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideIn {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }
  `]
})
export class CartDrawerComponent {
  readonly cartStore = inject(CartStore);
  private readonly router = inject(Router);

  browseCatalog(): void {
    this.cartStore.closeDrawer();
    this.router.navigate(['/']);
  }

  isMaxStockReached(item: CartItem): boolean {
    if (item.stockAvailable === undefined || item.stockAvailable === null) return false;
    return item.quantity >= item.stockAvailable;
  }

  incrementSupply(item: CartItem): void {
    if (!this.isMaxStockReached(item)) {
      this.cartStore.updateQuantity(item.id, item.quantity + 1);
    }
  }

  decrementSupply(item: CartItem): void {
    if (item.quantity > 1) {
      this.cartStore.updateQuantity(item.id, item.quantity - 1);
    }
  }

  proceedToCheckout(): void {
    if (!this.cartStore.canCheckout()) return;
    this.cartStore.closeDrawer();
    this.router.navigate(['/checkout']);
  }
}
