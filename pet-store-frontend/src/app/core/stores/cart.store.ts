import { Injectable, signal, computed, inject } from '@angular/core';
import { Cart, CartItem, CartItemType } from '../models/cart.model';
import { CartService } from '../services/cart.service';

@Injectable({
  providedIn: 'root'
})
export class CartStore {
  private readonly cartService = inject(CartService);

  readonly cart = signal<Cart | null>(null);
  readonly loading = signal<boolean>(false);
  readonly updatingItemId = signal<number | null>(null);
  readonly error = signal<string | null>(null);
  readonly isDrawerOpen = signal<boolean>(false);

  readonly items = computed<CartItem[]>(() => this.cart()?.items ?? []);
  readonly totalCount = computed<number>(() => this.cart()?.totalItems ?? 0);
  readonly totalPrice = computed<number>(() => this.cart()?.totalPrice ?? 0);
  readonly canCheckout = computed<boolean>(() => this.cart()?.canCheckout ?? false);
  readonly hasUnavailableItems = computed<boolean>(() =>
    (this.cart()?.items ?? []).some(item => {
      const avail = item.isAvailable ?? (item as any).available;
      return avail === false;
    })
  );

  constructor() {
    this.loadCart();
  }

  loadCart(): void {
    this.loading.set(true);
    this.cartService.getCart().subscribe({
      next: cart => {
        this.cart.set(cart);
        this.loading.set(false);
        this.error.set(null);
      },
      error: err => {
        this.loading.set(false);
        console.error('Failed to load cart', err);
      }
    });
  }

  addItem(itemType: CartItemType, itemId: number, quantity: number = 1): void {
    this.loading.set(true);
    this.error.set(null);

    this.cartService.addItem({ itemType, itemId, quantity }).subscribe({
      next: updatedCart => {
        this.cart.set(updatedCart);
        this.loading.set(false);
        this.isDrawerOpen.set(true);
      },
      error: err => {
        this.loading.set(false);
        const errorMsg = err.error?.detail || err.error?.message || 'Failed to add item to cart';
        this.error.set(errorMsg);
      }
    });
  }

  updateQuantity(itemId: number, quantity: number): void {
    if (quantity < 1) {
      this.removeItem(itemId);
      return;
    }

    this.updatingItemId.set(itemId);
    this.error.set(null);

    this.cartService.updateItemQuantity(itemId, quantity).subscribe({
      next: updatedCart => {
        this.cart.set(updatedCart);
        this.updatingItemId.set(null);
      },
      error: err => {
        this.updatingItemId.set(null);
        const errorMsg = err.error?.detail || err.error?.message || 'Failed to update item quantity';
        this.error.set(errorMsg);
      }
    });
  }

  removeItem(itemId: number): void {
    this.updatingItemId.set(itemId);
    this.error.set(null);

    this.cartService.removeItem(itemId).subscribe({
      next: updatedCart => {
        this.cart.set(updatedCart);
        this.updatingItemId.set(null);
      },
      error: err => {
        this.updatingItemId.set(null);
        const errorMsg = err.error?.detail || err.error?.message || 'Failed to remove item';
        this.error.set(errorMsg);
      }
    });
  }

  clearCart(): void {
    this.loading.set(true);
    this.error.set(null);

    this.cartService.clearCart().subscribe({
      next: clearedCart => {
        this.cart.set(clearedCart);
        this.loading.set(false);
      },
      error: err => {
        this.loading.set(false);
        const errorMsg = err.error?.detail || err.error?.message || 'Failed to clear cart';
        this.error.set(errorMsg);
      }
    });
  }

  syncGuestCartOnLogin(): void {
    const currentItems = this.items();
    if (currentItems.length === 0) {
      this.loadCart();
      return;
    }

    const syncPayload = {
      items: currentItems.map(item => ({
        itemType: item.itemType,
        itemId: item.itemId,
        quantity: item.quantity
      }))
    };

    this.cartService.syncGuestCart(syncPayload).subscribe({
      next: mergedCart => {
        this.cart.set(mergedCart);
      },
      error: () => {
        this.loadCart();
      }
    });
  }

  openDrawer(): void {
    this.isDrawerOpen.set(true);
    this.error.set(null);
  }

  closeDrawer(): void {
    this.isDrawerOpen.set(false);
    this.error.set(null);
  }

  toggleDrawer(): void {
    this.isDrawerOpen.update(open => !open);
    this.error.set(null);
  }

  isPetInCart(petId: number): boolean {
    return this.items().some(item => item.itemType === 'PET' && item.itemId === petId);
  }
}
