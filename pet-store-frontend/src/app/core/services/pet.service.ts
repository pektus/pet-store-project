import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  PetSummary,
  PetDetail,
  PetCreateRequest,
  PetUpdateRequest,
  PetStatusUpdateRequest,
  PetStatus
} from '../models/pet.model';
import { PageResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class PetService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/pets';

  getPets(params: {
    search?: string;
    category?: string;
    breed?: string;
    status?: PetStatus;
    minPrice?: number | null;
    maxPrice?: number | null;
    page?: number;
    size?: number;
    sort?: string;
  }): Observable<PageResponse<PetSummary>> {
    let httpParams = new HttpParams();

    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.category) httpParams = httpParams.set('category', params.category);
    if (params.breed) httpParams = httpParams.set('breed', params.breed);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.minPrice != null) httpParams = httpParams.set('minPrice', params.minPrice.toString());
    if (params.maxPrice != null) httpParams = httpParams.set('maxPrice', params.maxPrice.toString());
    if (params.page != null) httpParams = httpParams.set('page', params.page.toString());
    if (params.size != null) httpParams = httpParams.set('size', params.size.toString());
    if (params.sort) httpParams = httpParams.set('sort', params.sort);

    return this.http.get<PageResponse<PetSummary>>(this.baseUrl, { params: httpParams });
  }

  getPetById(id: number): Observable<PetDetail> {
    return this.http.get<PetDetail>(`${this.baseUrl}/${id}`);
  }

  createPet(request: PetCreateRequest): Observable<PetDetail> {
    return this.http.post<PetDetail>(this.baseUrl, request);
  }

  updatePet(id: number, request: PetUpdateRequest): Observable<PetDetail> {
    return this.http.put<PetDetail>(`${this.baseUrl}/${id}`, request);
  }

  updatePetStatus(id: number, status: PetStatus): Observable<PetDetail> {
    const payload: PetStatusUpdateRequest = { status };
    return this.http.patch<PetDetail>(`${this.baseUrl}/${id}/status`, payload);
  }

  deletePet(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/categories`);
  }

  getBreeds(category?: string): Observable<string[]> {
    let params = new HttpParams();
    if (category) {
      params = params.set('category', category);
    }
    return this.http.get<string[]>(`${this.baseUrl}/breeds`, { params });
  }
}
