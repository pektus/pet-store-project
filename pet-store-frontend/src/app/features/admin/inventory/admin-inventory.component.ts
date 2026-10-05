import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PetService } from '../../../core/services/pet.service';
import { PetDetail, PetStatus, PetSummary } from '../../../core/models/pet.model';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { ConfirmationModalComponent } from '../../../shared/components/confirmation-modal/confirmation-modal.component';
import { AdminPetFormComponent } from '../pet-form/admin-pet-form.component';
import { AdminSupplyInventoryComponent } from '../supply-inventory/admin-supply-inventory.component';

@Component({
  selector: 'app-admin-inventory',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CurrencyPipe,
    DatePipe,
    PaginationComponent,
    ConfirmationModalComponent,
    AdminPetFormComponent,
    AdminSupplyInventoryComponent
  ],
  templateUrl: './admin-inventory.component.html',
  styles: [`
    .inventory-page {
      padding-top: 2rem;
      padding-bottom: 4rem;
    }
    .admin-tabs {
      display: flex;
      gap: 0.5rem;
      border-bottom: 2px solid var(--border);
      margin-bottom: 2rem;
    }
    .tab-btn {
      padding: 0.75rem 1.5rem;
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--text-muted);
      border: none;
      background: transparent;
      border-bottom: 3px solid transparent;
      margin-bottom: -2px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .tab-btn:hover {
      color: var(--primary);
    }
    .tab-btn.active {
      color: var(--primary);
      border-bottom-color: var(--primary);
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    .page-header h2 {
      font-size: 1.5rem;
      font-weight: 700;
    }
    .subtitle {
      font-size: 0.875rem;
      color: var(--text-muted);
    }
    .control-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #ffffff;
      padding: 1rem 1.25rem;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      margin-bottom: 1.5rem;
    }
    .filter-group {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .filter-group label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-muted);
    }
    .filter-group select {
      padding: 0.4rem 0.75rem;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: #ffffff;
      font-size: 0.875rem;
    }
    .inventory-stats {
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
    .name-cell strong {
      color: var(--text-main);
    }
    .category-pill {
      font-size: 0.75rem;
      background: #eef2ff;
      color: var(--primary);
      padding: 0.2rem 0.5rem;
      border-radius: 9999px;
      font-weight: 600;
    }
    .status-select {
      padding: 0.25rem 0.5rem;
      border: 1px solid var(--border);
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      background: #ffffff;
    }
    .date-cell {
      color: var(--text-muted);
      font-size: 0.8125rem;
    }
    .actions-cell {
      white-space: nowrap;
      display: flex;
      gap: 0.5rem;
    }
    .loading-state, .empty-state {
      padding: 4rem;
      text-align: center;
      color: var(--text-muted);
    }
  `]
})
export class AdminInventoryComponent implements OnInit {
  private readonly petService = inject(PetService);

  readonly activeTab = signal<'pets' | 'supplies'>('pets');

  readonly pets = signal<PetSummary[]>([]);
  readonly totalElements = signal<number>(0);
  readonly totalPages = signal<number>(0);
  readonly currentPage = signal<number>(0);
  readonly selectedStatus = signal<string>('');
  readonly isLoading = signal<boolean>(false);

  readonly isFormOpen = signal<boolean>(false);
  readonly petToEdit = signal<PetDetail | null>(null);

  readonly isConfirmOpen = signal<boolean>(false);
  readonly petToDelete = signal<PetSummary | null>(null);
  readonly deletePromptMessage = signal<string>('');

  ngOnInit(): void {
    this.loadInventory();
  }

  loadInventory(): void {
    this.isLoading.set(true);
    const statusParam = (this.selectedStatus() || undefined) as PetStatus | undefined;

    this.petService.getPets({
      status: statusParam,
      page: this.currentPage(),
      size: 10,
      sort: 'createdAt,desc'
    }).subscribe({
      next: res => {
        this.pets.set(res.content);
        this.totalElements.set(res.totalElements);
        this.totalPages.set(res.totalPages);
        this.isLoading.set(false);
      },
      error: err => {
        console.error('Failed to load inventory', err);
        this.isLoading.set(false);
      }
    });
  }

  onStatusFilterChange(status: string): void {
    this.selectedStatus.set(status);
    this.currentPage.set(0);
    this.loadInventory();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadInventory();
  }

  changeStatus(id: number, newStatus: PetStatus): void {
    this.petService.updatePetStatus(id, newStatus).subscribe({
      next: () => this.loadInventory(),
      error: err => alert(err.error?.detail || 'Failed to update status.')
    });
  }

  openAddModal(): void {
    this.petToEdit.set(null);
    this.isFormOpen.set(true);
  }

  openEditModal(id: number): void {
    this.petService.getPetById(id).subscribe({
      next: pet => {
        this.petToEdit.set(pet);
        this.isFormOpen.set(true);
      },
      error: () => alert('Could not fetch pet details.')
    });
  }

  confirmDelete(pet: PetSummary): void {
    this.petToDelete.set(pet);
    this.deletePromptMessage.set(`Are you sure you want to delete "${pet.name}" (${pet.breed})? Associated media files will also be purged.`);
    this.isConfirmOpen.set(true);
  }

  executeDelete(): void {
    const pet = this.petToDelete();
    if (!pet) return;

    this.petService.deletePet(pet.id).subscribe({
      next: () => {
        this.isConfirmOpen.set(false);
        this.petToDelete.set(null);
        this.loadInventory();
      },
      error: () => alert('Failed to delete pet.')
    });
  }
}
