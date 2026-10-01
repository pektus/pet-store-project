import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MediaUploadResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class MediaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/media';

  upload(file: File): Observable<MediaUploadResponse> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<MediaUploadResponse>(`${this.baseUrl}/upload`, formData);
  }

  delete(filename: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${filename}`);
  }
}
