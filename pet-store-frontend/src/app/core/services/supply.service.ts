import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PageResponse } from '../models/api-response.model';
import {
  Supply,
  SupplyCreateRequest,
  SupplyStockAdjustmentRequest,
  SupplyUpdateRequest
} from '../models/supply.model';

@Injectable({
  providedIn: 'root'
})
export class SupplyService {
  private readonly http = inject(HttpClient);

  getSupplies(params?: {
    search?: string;
    category?: string;
    status?: string;
    inStockOnly?: boolean;
    minPrice?: number | null;
    maxPrice?: number | null;
    page?: number;
    size?: number;
    sort?: string;
  }): Observable<PageResponse<Supply>> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.search) httpParams = httpParams.set('search', params.search);
      if (params.category) httpParams = httpParams.set('category', params.category);
      if (params.status) httpParams = httpParams.set('status', params.status);
      if (params.inStockOnly != null) httpParams = httpParams.set('inStockOnly', params.inStockOnly);
      if (params.minPrice != null) httpParams = httpParams.set('minPrice', params.minPrice.toString());
      if (params.maxPrice != null) httpParams = httpParams.set('maxPrice', params.maxPrice.toString());
      if (params.page != null) httpParams = httpParams.set('page', params.page.toString());
      if (params.size != null) httpParams = httpParams.set('size', params.size.toString());
      if (params.sort) httpParams = httpParams.set('sort', params.sort);
    }

    return this.http.get<PageResponse<Supply>>('/api/supplies', { params: httpParams });
  }

  getSupplyById(id: number): Observable<Supply> {
    return this.http.get<Supply>(`/api/supplies/${id}`);
  }

  getCategories(): Observable<string[]> {
    return this.http.get<string[]>('/api/supplies/categories');
  }

  createSupply(request: SupplyCreateRequest): Observable<Supply> {
    return this.http.post<Supply>('/api/admin/supplies', request);
  }

  updateSupply(id: number, request: SupplyUpdateRequest): Observable<Supply> {
    return this.http.put<Supply>(`/api/admin/supplies/${id}`, request);
  }

  adjustStock(id: number, request: SupplyStockAdjustmentRequest): Observable<Supply> {
    return this.http.patch<Supply>(`/api/admin/supplies/${id}/stock`, request);
  }

  deleteSupply(id: number): Observable<void> {
    return this.http.delete<void>(`/api/admin/supplies/${id}`);
  }
}
