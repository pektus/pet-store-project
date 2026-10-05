import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupplyService } from '../../../core/services/supply.service';
import { Supply, SupplyCategory, SupplyStatus } from '../../../core/models/supply.model';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { ConfirmationModalComponent } from '../../../shared/components/confirmation-modal/confirmation-modal.component';
import { AdminSupplyFormComponent } from '../supply-form/admin-supply-form.component';

@Component({
  selector: 'app-admin-supply-inventory',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CurrencyPipe,
    PaginationComponent,
    ConfirmationModalComponent,
    AdminSupplyFormComponent
  ],
  templateUrl: './admin-supply-inventory.component.html',
  styles: [`
    .supply-inventory-section {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .section-header h3 {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-main);
      margin-bottom: 0.25rem;
    }
    .subtitle {
      font-size: 0.875rem;
      color: var(--text-muted);
    }
    .control-bar {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
      background: #ffffff;
      padding: 1rem;
      border: 1px solid var(--border);
      border-radius: var(--radius);
    }
    .filter-group {
      min-width: 180px;
    }
    .search-field {
      min-width: 240px;
    }
    .form-control {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--border);
      border-radius: 6px;
      font-size: 0.875rem;
      outline: none;
    }
    .form-control:focus {
      border-color: var(--primary);
    }
    .stats-badge {
      margin-left: auto;
      font-size: 0.875rem;
      color: var(--text-muted);
    }
    .table-container {
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow-x: auto;
    }
    .inventory-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.875rem;
    }
    .inventory-table th {
      background: #f8fafc;
      padding: 0.75rem 1rem;
      font-weight: 600;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border);
    }
    .inventory-table td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border);
      vertical-align: middle;
    }
    .photo-cell {
      width: 56px;
    }
    .thumb-img {
      width: 44px;
      height: 44px;
      object-fit: cover;
      border-radius: 6px;
      border: 1px solid var(--border);
    }
    .sku-cell code {
      background: #f1f5f9;
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      font-size: 0.75rem;
    }
    .name-cell strong {
      display: block;
      color: var(--text-main);
    }
    .desc-preview {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 0.2rem;
      max-width: 250px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .category-pill {
      font-size: 0.75rem;
      background: #eef2ff;
      color: var(--primary);
      padding: 0.2rem 0.5rem;
      border-radius: 9999px;
      font-weight: 600;
    }
    .stock-badge {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
    }
    .badge-ok {
      background-color: #dcfce7;
      color: #166534;
    }
    .badge-low {
      background-color: #fef9c3;
      color: #854d0e;
    }
    .badge-out {
      background-color: #fee2e2;
      color: #991b1b;
    }
    .status-pill {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
    }
    .status-active {
      color: #16a34a;
    }
    .status-out_of_stock {
      color: #dc2626;
    }
    .status-discontinued {
      color: #64748b;
    }
    .actions-cell {
      white-space: nowrap;
      display: flex;
      gap: 0.35rem;
    }
    .loading-state, .empty-state {
      padding: 3rem;
      text-align: center;
      color: var(--text-muted);
    }
    .adjust-modal {
      max-width: 440px;
    }
    .adjust-modal .modal-body {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .projected-stock {
      margin-top: 0.5rem;
      font-size: 0.875rem;
      color: var(--primary);
    }
    .error-alert {
      padding: 0.5rem;
      background-color: #fee2e2;
      color: #991b1b;
      border-radius: 4px;
      font-size: 0.8125rem;
    }
    .close-btn {
      font-size: 1.5rem;
      color: var(--text-muted);
    }
  `]
})
export class AdminSupplyInventoryComponent implements OnInit {
  private readonly supplyService = inject(SupplyService);
  protected readonly Number = Number;

  readonly supplies = signal<Supply[]>([]);
  readonly totalElements = signal<number>(0);
  readonly totalPages = signal<number>(0);
  readonly currentPage = signal<number>(0);
  readonly pageSize = signal<number>(10);
  readonly isLoading = signal<boolean>(false);

  // Filters
  readonly searchTerm = signal<string>('');
  readonly selectedCategory = signal<string>('');
  readonly selectedStatus = signal<string>('');

  // Modals
  readonly isFormModalOpen = signal<boolean>(false);
  readonly selectedSupply = signal<Supply | null>(null);

  // Stock Adjustment State
  readonly isAdjustModalOpen = signal<boolean>(false);
  readonly supplyToAdjust = signal<Supply | null>(null);
  readonly adjustmentAmount = signal<number>(0);
  readonly adjustmentReason = signal<string>('');
  readonly isAdjusting = signal<boolean>(false);
  readonly adjustError = signal<string | null>(null);

  // Delete State
  readonly isDeleteModalOpen = signal<boolean>(false);
  readonly supplyToDelete = signal<Supply | null>(null);
  readonly deleteConfirmMessage = signal<string>('');

  ngOnInit(): void {
    this.loadSupplies();
  }

  loadSupplies(): void {
    this.isLoading.set(true);
    this.supplyService.getSupplies({
      search: this.searchTerm().trim() || undefined,
      category: this.selectedCategory() || undefined,
      status: this.selectedStatus() || undefined,
      page: this.currentPage(),
      size: this.pageSize()
    }).subscribe({
      next: res => {
        this.supplies.set(res.content);
        this.totalElements.set(res.totalElements);
        this.totalPages.set(res.totalPages);
        this.isLoading.set(false);
      },
      error: err => {
        console.error('Failed to load supplies', err);
        this.isLoading.set(false);
      }
    });
  }

  onSearchChange(val: string): void {
    this.searchTerm.set(val);
    this.currentPage.set(0);
    this.loadSupplies();
  }

  onCategoryChange(cat: string): void {
    this.selectedCategory.set(cat);
    this.currentPage.set(0);
    this.loadSupplies();
  }

  onStatusChange(stat: string): void {
    this.selectedStatus.set(stat);
    this.currentPage.set(0);
    this.loadSupplies();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadSupplies();
  }

  openAddModal(): void {
    this.selectedSupply.set(null);
    this.isFormModalOpen.set(true);
  }

  openEditModal(item: Supply): void {
    this.selectedSupply.set(item);
    this.isFormModalOpen.set(true);
  }

  openAdjustModal(item: Supply): void {
    this.supplyToAdjust.set(item);
    this.adjustmentAmount.set(0);
    this.adjustmentReason.set('');
    this.adjustError.set(null);
    this.isAdjustModalOpen.set(true);
  }

  onConfirmAdjustment(): void {
    const supply = this.supplyToAdjust();
    const amount = Number(this.adjustmentAmount());
    if (!supply || amount === 0) return;

    this.isAdjusting.set(true);
    this.adjustError.set(null);

    this.supplyService.adjustStock(supply.id, {
      adjustment: amount,
      reason: this.adjustmentReason().trim() || undefined
    }).subscribe({
      next: () => {
        this.isAdjusting.set(false);
        this.isAdjustModalOpen.set(false);
        this.loadSupplies();
      },
      error: err => {
        this.isAdjusting.set(false);
        this.adjustError.set(err.error?.detail || err.error?.message || 'Failed to adjust stock.');
      }
    });
  }

  openDeleteConfirm(item: Supply): void {
    this.supplyToDelete.set(item);
    this.deleteConfirmMessage.set(`Are you sure you want to delete "${item.name}" (SKU: ${item.sku})? This cannot be undone.`);
    this.isDeleteModalOpen.set(true);
  }

  onConfirmDelete(): void {
    const item = this.supplyToDelete();
    if (!item) return;

    this.supplyService.deleteSupply(item.id).subscribe({
      next: () => {
        this.isDeleteModalOpen.set(false);
        this.loadSupplies();
      },
      error: err => {
        alert(err.error?.detail || 'Failed to delete supply item.');
        this.isDeleteModalOpen.set(false);
      }
    });
  }
}
