import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CheckoutQuote, CheckoutRequest, OrderResponse } from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class CheckoutService {
  private readonly http = inject(HttpClient);

  getQuote(): Observable<CheckoutQuote> {
    return this.http.get<CheckoutQuote>('/api/checkout/quote');
  }

  processCheckout(request: CheckoutRequest): Observable<OrderResponse> {
    return this.http.post<OrderResponse>('/api/checkout', request);
  }
}
