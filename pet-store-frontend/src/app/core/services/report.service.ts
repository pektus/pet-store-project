import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InventoryReport, SalesPeriod, SalesReport } from '../models/report.model';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/admin/reports';

  getSalesReport(period: SalesPeriod = 'DAY'): Observable<SalesReport> {
    const params = new HttpParams().set('period', period);
    return this.http.get<SalesReport>(`${this.baseUrl}/sales`, { params });
  }

  getInventoryReport(): Observable<InventoryReport> {
    return this.http.get<InventoryReport>(`${this.baseUrl}/inventory`);
  }

  downloadSalesCsv(period: SalesPeriod = 'DAY'): void {
    const params = new HttpParams().set('period', period);
    this.http.get(`${this.baseUrl}/sales/csv`, { params, responseType: 'blob' }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sales-report-${period.toLowerCase()}-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => console.error('Failed to export sales CSV', err)
    });
  }

  downloadInventoryCsv(): void {
    this.http.get(`${this.baseUrl}/inventory/csv`, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventory-report-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => console.error('Failed to export inventory CSV', err)
    });
  }
}
