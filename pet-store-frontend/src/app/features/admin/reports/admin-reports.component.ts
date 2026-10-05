import { Component, OnInit, inject, model, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ReportService } from '../../../core/services/report.service';
import { InventoryReport, SalesPeriod, SalesReport } from '../../../core/models/report.model';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, FormsModule],
  template: `
    <div class="reports-container">
      <header class="reports-header">
        <div>
          <h1>Financial &amp; Analytics Reports</h1>
          <p class="subtitle">Real-time revenue metrics, financial accounting ledger breakdowns, and inventory tracking.</p>
        </div>
        <div class="header-actions">
          <a routerLink="/admin/orders" class="btn btn-outline btn-sm">&#128221; Order Fulfillment</a>
          <a routerLink="/admin/inventory" class="btn btn-outline btn-sm">&#128230; Inventory Management</a>
        </div>
      </header>

      <!-- Main Tab Switcher (Signal-based) -->
      <nav class="report-tabs">
        <button 
          class="tab-btn" 
          [class.active]="activeTab() === 'SALES'" 
          (click)="switchTab('SALES')">
          &#128178; Sales &amp; Revenue Analytics
        </button>
        <button 
          class="tab-btn" 
          [class.active]="activeTab() === 'INVENTORY'" 
          (click)="switchTab('INVENTORY')">
          &#128202; Inventory &amp; Stock Valuation
        </button>
      </nav>

      <!-- TAB 1: SALES & REVENUE REPORT -->
      @if (activeTab() === 'SALES') {
        <section class="tab-content">
          <!-- Controls Bar -->
          <div class="controls-card">
            <div class="period-toggle-group">
              <span class="period-label">Aggregated By:</span>
              <button 
                class="btn-period" 
                [class.active]="selectedPeriod() === 'DAY'" 
                (click)="setPeriod('DAY')">
                Daily (30 Days)
              </button>
              <button 
                class="btn-period" 
                [class.active]="selectedPeriod() === 'WEEK'" 
                (click)="setPeriod('WEEK')">
                Weekly (12 Weeks)
              </button>
              <button 
                class="btn-period" 
                [class.active]="selectedPeriod() === 'MONTH'" 
                (click)="setPeriod('MONTH')">
                Monthly (12 Months)
              </button>
            </div>

            <button class="btn btn-primary btn-sm btn-csv" (click)="exportSalesCsv()">
              &#128190; Export Sales CSV
            </button>
          </div>

          @if (isSalesLoading()) {
            <div class="loading-state">
              <div class="spinner"></div>
              <p>Aggregating financial ledger data...</p>
            </div>
          } @else if (salesError()) {
            <div class="error-banner">
              <span>&#9888; {{ salesError() }}</span>
              <button class="btn btn-outline btn-sm" (click)="loadSalesReport()">Retry</button>
            </div>
          } @else {
            @if (salesReport(); as report) {
            <!-- Sales KPI Cards -->
            <div class="kpi-grid">
              <div class="kpi-card highlight">
                <span class="kpi-title">Net Revenue</span>
                <strong class="kpi-val">{{ report.netRevenue | currency }}</strong>
                <span class="kpi-sub">
                  Gross: {{ report.grossRevenue | currency }} &bull; Refunds: {{ report.refundAmount | currency }}
                </span>
              </div>

              <div class="kpi-card">
                <span class="kpi-title">Total Orders Placed</span>
                <strong class="kpi-val">{{ report.totalOrders }}</strong>
                <span class="kpi-sub">
                  Average Order: {{ report.averageOrderValue | currency }}
                </span>
              </div>

              <div class="kpi-card">
                <span class="kpi-title">Companions Adopted</span>
                <strong class="kpi-val text-amber">&#128062; {{ report.petsAdopted }}</strong>
                <span class="kpi-sub">Pets welcomed into new homes</span>
              </div>

              <div class="kpi-card">
                <span class="kpi-title">Supplies Units Sold</span>
                <strong class="kpi-val text-blue">&#128722; {{ report.suppliesSold }}</strong>
                <span class="kpi-sub">Physical pet care items</span>
              </div>
            </div>

            <!-- Time-Series Breakdown Table -->
            <div class="table-card">
              <div class="table-header">
                <h3>Period Performance Breakdown</h3>
                <span class="table-meta">{{ report.dataPoints.length }} aggregation period(s)</span>
              </div>

              <table class="data-table">
                <thead>
                  <tr>
                    <th>Period</th>
                    <th class="text-right">Gross Revenue</th>
                    <th class="text-right">Refunds</th>
                    <th class="text-right">Net Revenue</th>
                    <th class="text-center">Orders</th>
                    <th class="text-center">Pets Adopted</th>
                    <th class="text-center">Supplies Sold</th>
                  </tr>
                </thead>
                <tbody>
                  @for (dp of report.dataPoints; track dp.periodLabel) {
                    <tr>
                      <td class="period-col">
                        <strong>{{ dp.periodLabel }}</strong>
                      </td>
                      <td class="text-right">{{ dp.grossRevenue | currency }}</td>
                      <td class="text-right text-danger">{{ dp.refundAmount | currency }}</td>
                      <td class="text-right"><strong class="text-success">{{ dp.netRevenue | currency }}</strong></td>
                      <td class="text-center"><span class="badge">{{ dp.ordersCount }}</span></td>
                      <td class="text-center"><span class="badge-amber">{{ dp.petsCount }}</span></td>
                      <td class="text-center"><span class="badge-blue">{{ dp.suppliesCount }}</span></td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="7" class="text-center text-muted py-3">No sales transactions recorded in this period.</td>
                    </tr>
                  }
                </tbody>
                <tfoot>
                  <tr class="summary-row">
                    <td><strong>TOTALS</strong></td>
                    <td class="text-right"><strong>{{ report.grossRevenue | currency }}</strong></td>
                    <td class="text-right text-danger"><strong>{{ report.refundAmount | currency }}</strong></td>
                    <td class="text-right"><strong class="text-success">{{ report.netRevenue | currency }}</strong></td>
                    <td class="text-center"><strong>{{ report.totalOrders }}</strong></td>
                    <td class="text-center"><strong>{{ report.petsAdopted }}</strong></td>
                    <td class="text-center"><strong>{{ report.suppliesSold }}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            }
          }
        </section>
      }

      <!-- TAB 2: INVENTORY & STOCK VALUATION REPORT -->
      @if (activeTab() === 'INVENTORY') {
        <section class="tab-content">
          <!-- Inventory Controls -->
          <div class="controls-card">
            <div>
              <h3>Real-Time Catalog &amp; Supply Valuation</h3>
              <p class="subtitle text-sm">Updated dynamically from the active PostgreSQL catalog and inventory ledger.</p>
            </div>

            <button class="btn btn-primary btn-sm btn-csv" (click)="exportInventoryCsv()">
              &#128190; Export Inventory CSV
            </button>
          </div>

          @if (isInventoryLoading()) {
            <div class="loading-state">
              <div class="spinner"></div>
              <p>Analyzing inventory levels and computing stock valuation...</p>
            </div>
          } @else if (inventoryError()) {
            <div class="error-banner">
              <span>&#9888; {{ inventoryError() }}</span>
              <button class="btn btn-outline btn-sm" (click)="loadInventoryReport()">Retry</button>
            </div>
          } @else {
            @if (inventoryReport(); as inv) {
            <!-- Inventory KPI Cards -->
            <div class="kpi-grid">
              <div class="kpi-card highlight">
                <span class="kpi-title">Total Supply Valuation</span>
                <strong class="kpi-val">{{ inv.totalSuppliesValuation | currency }}</strong>
                <span class="kpi-sub">{{ inv.totalSuppliesStockUnits }} units across {{ inv.totalSupplySkus }} active SKUs</span>
              </div>

              <div class="kpi-card">
                <span class="kpi-title">Pet Catalog Health</span>
                <strong class="kpi-val text-amber">{{ inv.availablePets }} / {{ inv.totalPets }}</strong>
                <span class="kpi-sub">
                  {{ inv.adoptedPets }} adopted ({{ calculateAdoptionRate(inv) }}% overall adoption rate)
                </span>
              </div>

              <div class="kpi-card">
                <span class="kpi-title">Stock Health</span>
                <strong class="kpi-val text-success">{{ inv.inStockSuppliesCount }} In Stock</strong>
                <span class="kpi-sub">Supplies above safety threshold</span>
              </div>

              <div class="kpi-card" [class.warning-card]="inv.lowStockSuppliesCount > 0 || inv.outOfStockSuppliesCount > 0">
                <span class="kpi-title">Stock Alerts</span>
                <strong class="kpi-val text-danger">{{ inv.lowStockSuppliesCount + inv.outOfStockSuppliesCount }}</strong>
                <span class="kpi-sub">
                  {{ inv.lowStockSuppliesCount }} low stock &bull; {{ inv.outOfStockSuppliesCount }} depleted
                </span>
              </div>
            </div>

            <!-- Low-Stock Alerts Section -->
            <div class="table-card mb-4">
              <div class="table-header">
                <h3>&#9888; Low-Stock &amp; Depleted Supplies</h3>
                <a routerLink="/admin/inventory" class="btn btn-outline btn-xs">Manage Stock in Inventory &rarr;</a>
              </div>

              <table class="data-table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Product Name</th>
                    <th class="text-center">Current Stock</th>
                    <th class="text-center">Threshold</th>
                    <th class="text-right">Unit Price</th>
                    <th class="text-center">Status</th>
                    <th class="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  @for (alert of inv.lowStockAlerts; track alert.sku) {
                    <tr>
                      <td><code class="sku-tag">{{ alert.sku }}</code></td>
                      <td><strong>{{ alert.name }}</strong></td>
                      <td class="text-center">
                        <span class="stock-pill" [class.depleted]="alert.stockQuantity === 0">
                          {{ alert.stockQuantity }} units
                        </span>
                      </td>
                      <td class="text-center text-muted">&le; {{ alert.lowStockThreshold }}</td>
                      <td class="text-right">{{ alert.unitPrice | currency }}</td>
                      <td class="text-center">
                        @if (alert.stockQuantity === 0) {
                          <span class="status-pill status-out">Out of Stock</span>
                        } @else {
                          <span class="status-pill status-low">Low Stock</span>
                        }
                      </td>
                      <td class="text-right">
                        <a routerLink="/admin/inventory" class="btn btn-outline btn-xs">Replenish</a>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="7" class="text-center text-success py-3">&#10004; All physical supplies are comfortably above their safety thresholds.</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Pet Taxonomy Adoption Breakdown -->
            <div class="table-card">
              <div class="table-header">
                <h3>Pet Species / Category Distribution</h3>
                <span class="table-meta">{{ inv.totalPets }} total pets tracked</span>
              </div>

              <table class="data-table">
                <thead>
                  <tr>
                    <th>Species Category</th>
                    <th class="text-center">Available for Adoption</th>
                    <th class="text-center">Adopted</th>
                    <th class="text-center">Total Registered</th>
                    <th class="text-right">Adoption Rate</th>
                  </tr>
                </thead>
                <tbody>
                  @for (cat of inv.petCategoryBreakdown; track cat.category) {
                    <tr>
                      <td><strong>{{ cat.category }}</strong></td>
                      <td class="text-center"><span class="badge-amber">{{ cat.available }}</span></td>
                      <td class="text-center"><span class="badge-green">{{ cat.adopted }}</span></td>
                      <td class="text-center">{{ cat.total }}</td>
                      <td class="text-right">
                        <div class="rate-bar-wrap">
                          <span>{{ cat.adoptionRate }}%</span>
                          <div class="progress-track">
                            <div class="progress-bar" [style.width.%]="cat.adoptionRate"></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            }
          }
        </section>
      }
    </div>
  `,
  styles: [`
    .reports-container {
      max-width: 1200px;
      margin: 2rem auto;
      padding: 0 1rem;
    }
    .reports-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid var(--border);
      padding-bottom: 1rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .reports-header h1 {
      font-size: 1.85rem;
      margin: 0;
      color: var(--primary);
    }
    .subtitle {
      color: var(--text-muted);
      margin: 0.25rem 0 0;
      font-size: 0.95rem;
    }
    .header-actions {
      display: flex;
      gap: 0.5rem;
    }
    .report-tabs {
      display: flex;
      gap: 0.5rem;
      border-bottom: 2px solid var(--border);
      margin-bottom: 1.5rem;
    }
    .tab-btn {
      padding: 0.75rem 1.25rem;
      background: transparent;
      border: none;
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-muted);
      cursor: pointer;
      border-bottom: 3px solid transparent;
      margin-bottom: -2px;
      transition: all 0.15s ease;
    }
    .tab-btn:hover {
      color: var(--primary);
    }
    .tab-btn.active {
      color: var(--primary);
      border-bottom-color: var(--primary);
    }
    .controls-card {
      background: #ffffff;
      padding: 1rem 1.25rem;
      border: 1px solid var(--border);
      border-radius: 10px;
      margin-bottom: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .controls-card h3 {
      margin: 0;
      font-size: 1.1rem;
    }
    .period-toggle-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .period-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-right: 0.25rem;
    }
    .btn-period {
      padding: 0.35rem 0.75rem;
      font-size: 0.85rem;
      font-weight: 500;
      border: 1px solid var(--border);
      background: #f8fafc;
      color: var(--text-main);
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-period:hover {
      background: #f1f5f9;
    }
    .btn-period.active {
      background: var(--primary);
      color: #ffffff;
      border-color: var(--primary);
    }
    .btn-csv {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .kpi-card {
      background: #ffffff;
      padding: 1.25rem;
      border-radius: 10px;
      border: 1px solid var(--border);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
    }
    .kpi-card.highlight {
      border-left: 4px solid var(--primary);
    }
    .kpi-card.warning-card {
      border-left: 4px solid #ef4444;
      background: #fffafa;
    }
    .kpi-title {
      display: block;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-muted);
      margin-bottom: 0.35rem;
    }
    .kpi-val {
      display: block;
      font-size: 1.85rem;
      color: var(--text-main);
      margin-bottom: 0.35rem;
    }
    .kpi-sub {
      display: block;
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .text-amber {
      color: #d97706;
    }
    .text-blue {
      color: #2563eb;
    }
    .text-green, .text-success {
      color: #16a34a;
    }
    .text-danger {
      color: #dc2626;
    }
    .text-muted {
      color: var(--text-muted);
    }
    .text-sm {
      font-size: 0.85rem;
    }
    .table-card {
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: 10px;
      overflow-x: auto;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
    }
    .table-header {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .table-header h3 {
      margin: 0;
      font-size: 1.1rem;
    }
    .table-meta {
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }
    .data-table th {
      background: #f8fafc;
      padding: 0.75rem 1rem;
      font-weight: 600;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border);
      white-space: nowrap;
    }
    .data-table td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    .data-table tr:hover {
      background: #fafbfc;
    }
    .summary-row {
      background: #f8fafc;
      border-top: 2px solid var(--border);
    }
    .badge, .badge-amber, .badge-blue, .badge-green {
      display: inline-block;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .badge {
      background: #f1f5f9;
      color: var(--text-main);
    }
    .badge-amber {
      background: #fef3c7;
      color: #92400e;
    }
    .badge-blue {
      background: #dbeafe;
      color: #1e40af;
    }
    .badge-green {
      background: #dcfce7;
      color: #166534;
    }
    .sku-tag {
      background: #f1f5f9;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      font-family: monospace;
      color: var(--primary);
    }
    .stock-pill {
      font-weight: 600;
    }
    .stock-pill.depleted {
      color: #dc2626;
    }
    .status-pill {
      display: inline-block;
      padding: 0.15rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .status-low {
      background: #fef3c7;
      color: #b45309;
    }
    .status-out {
      background: #fee2e2;
      color: #b91c1c;
    }
    .rate-bar-wrap {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.5rem;
    }
    .progress-track {
      width: 100px;
      height: 6px;
      background: #e2e8f0;
      border-radius: 9999px;
      overflow: hidden;
    }
    .progress-bar {
      height: 100%;
      background: #16a34a;
      border-radius: 9999px;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .py-3 { padding-top: 1rem; padding-bottom: 1rem; }
    .mb-4 { margin-bottom: 1.5rem; }
    .btn-xs {
      padding: 0.2rem 0.5rem;
      font-size: 0.75rem;
      border-radius: 4px;
      text-decoration: none;
    }
    .loading-state {
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
  `]
})
export class AdminReportsComponent implements OnInit {
  private readonly reportService = inject(ReportService);

  readonly activeTab = model<'SALES' | 'INVENTORY'>('SALES');
  readonly selectedPeriod = model<SalesPeriod>('DAY');

  // Sales State
  readonly salesReport = signal<SalesReport | null>(null);
  readonly isSalesLoading = signal<boolean>(true);
  readonly salesError = signal<string | null>(null);

  // Inventory State
  readonly inventoryReport = signal<InventoryReport | null>(null);
  readonly isInventoryLoading = signal<boolean>(false);
  readonly inventoryError = signal<string | null>(null);

  ngOnInit(): void {
    this.loadSalesReport();
  }

  switchTab(tab: 'SALES' | 'INVENTORY'): void {
    this.activeTab.set(tab);
    if (tab === 'SALES' && !this.salesReport()) {
      this.loadSalesReport();
    } else if (tab === 'INVENTORY' && !this.inventoryReport()) {
      this.loadInventoryReport();
    }
  }

  setPeriod(period: SalesPeriod): void {
    this.selectedPeriod.set(period);
    this.loadSalesReport();
  }

  loadSalesReport(): void {
    this.isSalesLoading.set(true);
    this.salesError.set(null);

    this.reportService.getSalesReport(this.selectedPeriod()).subscribe({
      next: (res) => {
        this.salesReport.set(res);
        this.isSalesLoading.set(false);
      },
      error: (err) => {
        this.salesError.set(err.error?.detail || 'Failed to aggregate sales metrics.');
        this.isSalesLoading.set(false);
      }
    });
  }

  loadInventoryReport(): void {
    this.isInventoryLoading.set(true);
    this.inventoryError.set(null);

    this.reportService.getInventoryReport().subscribe({
      next: (res) => {
        this.inventoryReport.set(res);
        this.isInventoryLoading.set(false);
      },
      error: (err) => {
        this.inventoryError.set(err.error?.detail || 'Failed to load inventory valuation.');
        this.isInventoryLoading.set(false);
      }
    });
  }

  exportSalesCsv(): void {
    this.reportService.downloadSalesCsv(this.selectedPeriod());
  }

  exportInventoryCsv(): void {
    this.reportService.downloadInventoryCsv();
  }

  calculateAdoptionRate(inv: InventoryReport): number {
    if (inv.totalPets === 0) return 0;
    const rate = (inv.adoptedPets / inv.totalPets) * 100;
    return Math.round(rate * 10) / 10;
  }
}
