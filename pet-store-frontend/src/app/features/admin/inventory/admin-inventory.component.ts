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
  template: `
    <div class="inventory-page container">
      <!-- Admin Inventory Tab Selector -->
      <div class="admin-tabs">
        <button 
          class="tab-btn" 
          [class.active]="activeTab() === 'pets'" 
          (click)="activeTab.set('pets')">
          &#128062; Pets Inventory
        </button>
        <button 
          class="tab-btn" 
          [class.active]="activeTab() === 'supplies'" 
          (click)="activeTab.set('supplies')">
          &#128230; Physical Merchandise & Supplies
        </button>
      </div>

      @if (activeTab() === 'pets') {
        <!-- Pets Inventory Section -->
        <div class="page-header">
          <div>
            <h2>Pet Profiles & Adoption Inventory</h2>
            <p class="subtitle">Maintain individual pet profiles, track lifecycle status, and manage listings</p>
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
                  <th>Photo</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Breed</th>
                  <th>Age</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (pet of pets(); track pet.id) {
                  <tr>
                    <td class="photo-cell">
                      <img 
                        [src]="pet.photoUrl || '/assets/placeholder-pet.png'" 
                        [alt]="pet.name" 
                        class="thumb-img" 
                        (error)="$any($event.target).src = 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2248%22 height=%2248%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2394a3b8%22 stroke-width=%221.5%22><rect width=%2218%22 height=%2218%22 x=%223%22 y=%223%22 rx=%222%22/><circle cx=%229%22 cy=%229%22 r=%222%22/><path d=%22m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21%22/></svg>'" />
                    </td>
                    <td class="name-cell">
                      <strong>{{ pet.name }}</strong>
                    </td>
                    <td>
                      <span class="category-pill">{{ pet.category }}</span>
                    </td>
                    <td>{{ pet.breed }}</td>
                    <td>{{ pet.ageMonths }} mos</td>
                    <td>{{ pet.price | currency }}</td>
                    <td>
                      <div class="status-dropdown-wrap">
                        <select 
                          [ngModel]="pet.status" 
                          (ngModelChange)="changeStatus(pet.id, $event)"
                          [disabled]="pet.status === 'ADOPTED'"
                          class="status-select">
                          <option value="AVAILABLE">AVAILABLE</option>
                          <option value="PENDING">PENDING</option>
                          <option value="ADOPTED">ADOPTED</option>
                        </select>
                      </div>
                    </td>
                    <td class="date-cell">{{ pet.createdAt | date:'shortDate' }}</td>
                    <td class="actions-cell">
                      <button class="btn btn-secondary btn-sm" (click)="openEditModal(pet.id)">
                        Edit
                      </button>
                      <button class="btn btn-danger btn-sm" (click)="confirmDelete(pet)">
                        Delete
                      </button>
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

        <!-- Add / Edit Modal -->
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
          confirmButtonText="Delete Pet"
          (confirm)="executeDelete()" 
          (cancel)="isConfirmOpen.set(false)" />
      } @else {
        <!-- Physical Supplies Section -->
        <app-admin-supply-inventory />
      }
    </div>
  `,
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
