import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PetService } from '../../../core/services/pet.service';
import { PetDetail, PetStatus, PetSummary } from '../../../core/models/pet.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { ConfirmationModalComponent } from '../../../shared/components/confirmation-modal/confirmation-modal.component';
import { AdminPetFormComponent } from '../pet-form/admin-pet-form.component';

@Component({
  selector: 'app-admin-inventory',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CurrencyPipe,
    DatePipe,
    StatusBadgeComponent,
    PaginationComponent,
    ConfirmationModalComponent,
    AdminPetFormComponent
  ],
  template: `
    <div class="inventory-page container">
      <div class="page-header">
        <div>
          <h2>Store Inventory Management</h2>
          <p class="subtitle">Maintain pet profiles, track lifecycle status, and manage listings</p>
        </div>
        <button class="btn btn-primary" (click)="openAddModal()">
          + Add New Pet
        </button>
      </div>

      <!-- Filter Controls Bar -->
      <div class="control-bar">
        <div class="filter-group">
          <label>Filter by Status:</label>
          <select [ngModel]="selectedStatus()" (ngModelChange)="onStatusFilterChange($event)">
            <option value="">All Statuses</option>
            <option value="AVAILABLE">AVAILABLE</option>
            <option value="PENDING">PENDING</option>
            <option value="ADOPTED">ADOPTED</option>
          </select>
        </div>

        <div class="inventory-stats">
          <span>Total Records: <strong>{{ totalElements() }}</strong></span>
        </div>
      </div>

      <!-- Inventory Table -->
      <div class="table-container">
        @if (isLoading()) {
          <div class="loading-state">Loading inventory data...</div>
        } @else if (pets().length === 0) {
          <div class="empty-state">No inventory records found.</div>
        } @else {
          <table class="inventory-table">
            <thead>
              <tr>
                <th>Pet</th>
                <th>Category</th>
                <th>Breed</th>
                <th>Price</th>
                <th>Status</th>
                <th>Date Added</th>
                <th>Lifecycle Actions</th>
                <th>Manage</th>
              </tr>
            </thead>
            <tbody>
              @for (pet of pets(); track pet.id) {
                <tr>
                  <td>
                    <div class="pet-cell">
                      @if (pet.photoUrl) {
                        <img [src]="pet.photoUrl" alt="" class="avatar" />
                      } @else {
                        <div class="avatar-placeholder">&#128054;</div>
                      }
                      <span class="name">{{ pet.name }}</span>
                    </div>
                  </td>
                  <td>{{ pet.category }}</td>
                  <td>{{ pet.breed }}</td>
                  <td class="price">{{ pet.price | currency }}</td>
                  <td>
                    <app-status-badge [status]="pet.status" />
                  </td>
                  <td>{{ pet.createdAt | date:'shortDate' }}</td>
                  <td>
                    <div class="status-actions">
                      @if (pet.status === 'AVAILABLE') {
                        <button 
                          class="btn btn-secondary btn-sm" 
                          (click)="changeStatus(pet.id, 'PENDING')">
                          Set Pending
                        </button>
                        <button 
                          class="btn btn-secondary btn-sm" 
                          (click)="changeStatus(pet.id, 'ADOPTED')">
                          Set Adopted
                        </button>
                      } @else if (pet.status === 'PENDING') {
                        <button 
                          class="btn btn-secondary btn-sm" 
                          (click)="changeStatus(pet.id, 'AVAILABLE')">
                          Set Available
                        </button>
                        <button 
                          class="btn btn-secondary btn-sm" 
                          (click)="changeStatus(pet.id, 'ADOPTED')">
                          Set Adopted
                        </button>
                      } @else {
                        <span class="status-locked">Finalized</span>
                      }
                    </div>
                  </td>
                  <td>
                    <div class="row-actions">
                      <button class="btn btn-secondary btn-sm" (click)="openEditModal(pet.id)">
                        Edit
                      </button>
                      <button class="btn btn-danger btn-sm" (click)="confirmDelete(pet)">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>

          <app-pagination 
            [currentPage]="currentPage()" 
            [totalPages]="totalPages()" 
            (pageChange)="onPageChange($event)" />
        }
      </div>

      <!-- Add/Edit Pet Modal Form -->
      <app-admin-pet-form 
        [isOpen]="isFormOpen()" 
        [petToEdit]="petToEdit()" 
        (close)="isFormOpen.set(false)" 
        (saved)="loadInventory()" />

      <!-- Delete Confirmation Modal -->
      <app-confirmation-modal 
        [isOpen]="isConfirmOpen()" 
        title="Delete Pet Record" 
        [message]="deletePromptMessage()" 
        confirmText="Delete Pet" 
        [isDestructive]="true" 
        (confirmed)="executeDelete()" 
        (cancelled)="isConfirmOpen.set(false)" />
    </div>
  `,
  styles: [`
    .inventory-page {
      padding-top: 2rem;
      padding-bottom: 3rem;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }
    .subtitle {
      color: var(--text-muted);
      font-size: 0.9375rem;
    }
    .control-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #ffffff;
      padding: 1rem 1.5rem;
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
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-muted);
    }
    .filter-group select {
      padding: 0.4rem 0.75rem;
      border: 1px solid var(--border);
      border-radius: 6px;
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
    }
    .inventory-table th {
      background-color: #f8fafc;
      padding: 0.875rem 1rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      border-bottom: 1px solid var(--border);
    }
    .inventory-table td {
      padding: 0.875rem 1rem;
      border-bottom: 1px solid var(--border);
      font-size: 0.875rem;
      vertical-align: middle;
    }
    .pet-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 6px;
      object-fit: cover;
    }
    .avatar-placeholder {
      width: 40px;
      height: 40px;
      border-radius: 6px;
      background: #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }
    .name {
      font-weight: 600;
      color: var(--text-main);
    }
    .price {
      font-weight: 600;
      color: var(--primary);
    }
    .status-actions {
      display: flex;
      gap: 0.5rem;
    }
    .status-locked {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-style: italic;
    }
    .row-actions {
      display: flex;
      gap: 0.5rem;
    }
    .loading-state, .empty-state {
      padding: 3rem;
      text-align: center;
      color: var(--text-muted);
    }
  `]
})
export class AdminInventoryComponent implements OnInit {
  private readonly petService = inject(PetService);

  readonly pets = signal<PetSummary[]>([]);
  readonly totalElements = signal<number>(0);
  readonly totalPages = signal<number>(0);
  readonly currentPage = signal<number>(0);
  readonly selectedStatus = signal<string>('');
  readonly isLoading = signal<boolean>(false);

  // Form Modal Signals
  readonly isFormOpen = signal<boolean>(false);
  readonly petToEdit = signal<PetDetail | null>(null);

  // Confirmation Modal Signals
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
