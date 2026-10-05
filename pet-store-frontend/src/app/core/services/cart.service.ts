import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AddToCartRequest, Cart, CartSyncRequest, UpdateCartItemRequest } from '../models/cart.model';

const SESSION_TOKEN_KEY = 'petstore_cart_session_token';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly http = inject(HttpClient);

  getSessionToken(): string | null {
    return localStorage.getItem(SESSION_TOKEN_KEY);
  }

  setSessionToken(token: string | null): void {
    if (token) {
      localStorage.setItem(SESSION_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(SESSION_TOKEN_KEY);
    }
  }

  private createHeaders(): HttpHeaders {
    let headers = new HttpHeaders();
    const token = this.getSessionToken();
    if (token) {
      headers = headers.set('X-Session-Token', token);
    }
    return headers;
  }

  getCart(): Observable<Cart> {
    return this.http.get<Cart>('/api/cart', { headers: this.createHeaders() }).pipe(
      tap(cart => {
        if (cart.sessionToken) {
          this.setSessionToken(cart.sessionToken);
        }
      })
    );
  }

  addItem(request: AddToCartRequest): Observable<Cart> {
    return this.http.post<Cart>('/api/cart/items', request, { headers: this.createHeaders() }).pipe(
      tap(cart => {
        if (cart.sessionToken) {
          this.setSessionToken(cart.sessionToken);
        }
      })
    );
  }

  updateItemQuantity(itemId: number, quantity: number): Observable<Cart> {
    const payload: UpdateCartItemRequest = { quantity };
    return this.http.put<Cart>(`/api/cart/items/${itemId}`, payload, { headers: this.createHeaders() });
  }

  removeItem(itemId: number): Observable<Cart> {
    return this.http.delete<Cart>(`/api/cart/items/${itemId}`, { headers: this.createHeaders() });
  }

  clearCart(): Observable<Cart> {
    return this.http.delete<Cart>('/api/cart', { headers: this.createHeaders() });
  }

  syncGuestCart(request: CartSyncRequest): Observable<Cart> {
    return this.http.post<Cart>('/api/cart/sync', request, { headers: this.createHeaders() });
  }
}
