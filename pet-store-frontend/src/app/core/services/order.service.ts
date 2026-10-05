import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  OrderCancelRequest,
  OrderPageResponse,
  OrderResponse,
  OrderStatus,
  OrderStatusUpdateRequest
} from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly customerApiUrl = '/api/customer/orders';
  private readonly adminApiUrl = '/api/admin/orders';

  // Customer Operations
  getCustomerOrders(page: number = 0, size: number = 10): Observable<OrderPageResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<OrderPageResponse>(this.customerApiUrl, { params });
  }

  getCustomerOrderDetail(orderNumber: string): Observable<OrderResponse> {
    return this.http.get<OrderResponse>(`${this.customerApiUrl}/${orderNumber}`);
  }

  cancelCustomerOrder(orderNumber: string, reason?: string): Observable<OrderResponse> {
    const body: OrderCancelRequest = { reason };
    return this.http.post<OrderResponse>(`${this.customerApiUrl}/${orderNumber}/cancel`, body);
  }

  // Admin Operations
  getAdminOrders(
    query?: string,
    status?: OrderStatus | 'ALL',
    page: number = 0,
    size: number = 10
  ): Observable<OrderPageResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (query && query.trim().length > 0) {
      params = params.set('query', query.trim());
    }
    if (status && status !== 'ALL') {
      params = params.set('status', status);
    }

    return this.http.get<OrderPageResponse>(this.adminApiUrl, { params });
  }

  getAdminOrderDetail(orderNumber: string): Observable<OrderResponse> {
    return this.http.get<OrderResponse>(`${this.adminApiUrl}/${orderNumber}`);
  }

  updateOrderStatus(orderNumber: string, request: OrderStatusUpdateRequest): Observable<OrderResponse> {
    return this.http.patch<OrderResponse>(`${this.adminApiUrl}/${orderNumber}/status`, request);
  }
}
