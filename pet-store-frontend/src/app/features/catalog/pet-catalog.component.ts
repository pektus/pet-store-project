import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CatalogStore } from '../../core/stores/catalog.store';
import { PetCardComponent } from './components/pet-card.component';
import { PetListRowComponent } from './components/pet-list-row.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { PetDetailModalComponent } from '../pet-detail/pet-detail-modal.component';

@Component({
  selector: 'app-pet-catalog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PetCardComponent,
    PetListRowComponent,
    PaginationComponent,
    PetDetailModalComponent
  ],
  template: `
    <div class="catalog-page container">
      <!-- Search & Filter Controls -->
      <section class="filter-card">
        <div class="search-row">
          <div class="search-input-wrapper">
            <span class="search-icon">&#128269;</span>
            <input 
              type="text" 
              placeholder="Search pets by name, breed, description..." 
              [ngModel]="store.rawSearchInput()" 
              (ngModelChange)="store.onSearchInput($event)"
              class="search-input" />
          </div>

          <div class="view-toggles">
            <button 
              class="toggle-btn" 
              [class.active]="store.viewMode() === 'grid'" 
              (click)="store.setViewMode('grid')" 
              title="Grid View">
              &#9638; Grid
            </button>
            <button 
              class="toggle-btn" 
              [class.active]="store.viewMode() === 'list'" 
              (click)="store.setViewMode('list')" 
              title="List View">
              &#9776; List
            </button>
          </div>
        </div>

        <!-- Category Filter Chips -->
        <div class="category-chips">
          <button 
            class="chip" 
            [class.active]="store.selectedCategory() === ''" 
            (click)="store.setCategory('')">
            All Pets
          </button>
          @for (cat of store.categories(); track cat) {
            <button 
              class="chip" 
              [class.active]="store.selectedCategory() === cat" 
              (click)="store.setCategory(cat)">
              {{ cat }}
            </button>
          }
        </div>

        <!-- Secondary Filters Row -->
        <div class="secondary-filters">
          @if (store.breeds().length > 0) {
            <div class="filter-item">
              <label>Breed</label>
              <select [ngModel]="store.selectedBreed()" (ngModelChange)="store.setBreed($event)">
                <option value="">All Breeds</option>
                @for (b of store.breeds(); track b) {
                  <option [value]="b">{{ b }}</option>
                }
              </select>
            </div>
          }

          <div class="filter-item price-inputs">
            <label>Price Range</label>
            <div class="price-bounds">
              <input 
                type="number" 
                placeholder="Min $" 
                [ngModel]="store.rawMinPrice()" 
                (ngModelChange)="onMinPriceChange($event)" />
              <span>-</span>
              <input 
                type="number" 
                placeholder="Max $" 
                [ngModel]="store.rawMaxPrice()" 
                (ngModelChange)="onMaxPriceChange($event)" />
            </div>
          </div>

          <div class="filter-item">
            <label>Sort By</label>
            <select [ngModel]="store.sortOption()" (ngModelChange)="store.setSort($event)">
              <option value="createdAt,desc">Newest Listings</option>
              <option value="price,asc">Price: Low to High</option>
              <option value="price,desc">Price: High to Low</option>
              <option value="name,asc">Name: A to Z</option>
            </select>
          </div>

          @if (store.hasActiveFilters()) {
            <div class="filter-item reset-action">
              <button class="btn btn-secondary btn-sm" (click)="store.resetFilters()">
                Reset Filters
              </button>
            </div>
          }
        </div>

        <!-- Active Filter Dismissal Chips -->
        @if (store.hasActiveFilters()) {
          <div class="active-filters-bar">
            <span class="active-filters-label">Active:</span>
            @for (f of store.activeFilters(); track f.key) {
              <span class="active-chip">
                {{ f.label }}
                <button type="button" class="remove-chip-btn" (click)="store.removeFilter(f.key)">&times;</button>
              </span>
            }
            <button type="button" class="clear-all-link" (click)="store.resetFilters()">Clear All</button>
          </div>
        }
      </section>

      <!-- Catalog Header / Result Count -->
      <div class="catalog-header">
        <h2 class="section-title">Available Pets</h2>
        <span class="result-count">
          Showing <strong>{{ store.pets().length }}</strong> of <strong>{{ store.totalElements() }}</strong> results
        </span>
      </div>

      <!-- Loading State -->
      @if (store.isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Finding loving companions...</p>
        </div>
      } @else if (store.pets().length === 0) {
        <div class="empty-state">
          <span class="empty-icon">&#128062;</span>
          <h3>No pets found matching your criteria</h3>
          <p>Try widening your search terms or clearing your active filters.</p>
          <button class="btn btn-primary" (click)="store.resetFilters()">Reset All Filters</button>
        </div>
      } @else {
        <!-- Grid View -->
        @if (store.viewMode() === 'grid') {
          <div class="pets-grid">
            @for (pet of store.pets(); track pet.id) {
              <app-pet-card [pet]="pet" (selectPet)="selectedPetId.set($event)" />
            }
          </div>
        } @else {
          <!-- List View -->
          <div class="pets-list">
            @for (pet of store.pets(); track pet.id) {
              <app-pet-list-row [pet]="pet" (selectPet)="selectedPetId.set($event)" />
            }
          </div>
        }

        <!-- Pagination -->
        <app-pagination 
          [currentPage]="store.currentPage()" 
          [totalPages]="store.totalPages()" 
          (pageChange)="store.setPage($event)" />
      }

      <!-- Pet Detail Modal -->
      <app-pet-detail-modal 
        [petId]="selectedPetId()" 
        (close)="selectedPetId.set(null)" />
    </div>
  `,
  styles: [`
    .catalog-page {
      padding-top: 2rem;
      padding-bottom: 3rem;
    }
    .filter-card {
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.5rem;
      box-shadow: var(--shadow-sm);
      margin-bottom: 2rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .search-row {
      display: flex;
      gap: 1rem;
      align-items: center;
    }
    .search-input-wrapper {
      position: relative;
      flex-grow: 1;
    }
    .search-icon {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      font-size: 1rem;
      color: var(--text-muted);
    }
    .search-input {
      width: 100%;
      padding: 0.75rem 1rem 0.75rem 2.75rem;
      border: 1px solid var(--border);
      border-radius: 8px;
      outline: none;
      transition: border-color 0.15s;
    }
    .search-input:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }
    .view-toggles {
      display: flex;
      background: #f1f5f9;
      border-radius: 8px;
      padding: 0.25rem;
    }
    .toggle-btn {
      padding: 0.5rem 0.875rem;
      border-radius: 6px;
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--text-muted);
    }
    .toggle-btn.active {
      background: #ffffff;
      color: var(--primary);
      box-shadow: var(--shadow-sm);
    }
    .category-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .chip {
      padding: 0.375rem 0.875rem;
      border-radius: 9999px;
      font-size: 0.8125rem;
      font-weight: 500;
      border: 1px solid var(--border);
      background: #ffffff;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.15s;
    }
    .chip:hover {
      border-color: var(--primary);
      color: var(--primary);
    }
    .chip.active {
      background: var(--primary);
      color: #ffffff;
      border-color: var(--primary);
    }
    .secondary-filters {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
      align-items: flex-end;
      padding-top: 0.5rem;
      border-top: 1px solid #f1f5f9;
    }
    .filter-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .filter-item label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
    }
    .filter-item select, .price-bounds input {
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: #ffffff;
    }
    .price-bounds {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .price-bounds input {
      width: 90px;
    }
    .reset-action {
      margin-left: auto;
    }
    .active-filters-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: #f8fafc;
      border-radius: 8px;
      border: 1px dashed var(--border);
      font-size: 0.8125rem;
    }
    .active-filters-label {
      font-weight: 600;
      color: var(--text-muted);
      margin-right: 0.25rem;
    }
    .active-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: #e0e7ff;
      color: var(--primary);
      padding: 0.25rem 0.625rem;
      border-radius: 9999px;
      font-weight: 500;
      font-size: 0.8125rem;
    }
    .remove-chip-btn {
      background: transparent;
      border: none;
      color: var(--primary);
      cursor: pointer;
      font-size: 1rem;
      line-height: 1;
      padding: 0;
      display: flex;
      align-items: center;
    }
    .remove-chip-btn:hover {
      color: #312e81;
    }
    .clear-all-link {
      background: none;
      border: none;
      color: var(--text-muted);
      text-decoration: underline;
      cursor: pointer;
      font-size: 0.8125rem;
      margin-left: 0.5rem;
    }
    .clear-all-link:hover {
      color: var(--danger);
    }
    .catalog-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 1.5rem;
    }
    .section-title {
      font-size: 1.5rem;
      font-weight: 700;
    }
    .result-count {
      font-size: 0.875rem;
      color: var(--text-muted);
    }
    .pets-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }
    .pets-list {
      display: flex;
      flex-direction: column;
    }
    .loading-state, .empty-state {
      padding: 4rem 1rem;
      text-align: center;
      background: #ffffff;
      border-radius: var(--radius);
      border: 1px solid var(--border);
    }
    .empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      display: block;
    }
    .empty-state h3 {
      font-size: 1.25rem;
      margin-bottom: 0.5rem;
    }
    .empty-state p {
      color: var(--text-muted);
      margin-bottom: 1.5rem;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--border);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class PetCatalogComponent implements OnInit {
  readonly store = inject(CatalogStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly selectedPetId = signal<number | null>(null);

  constructor() {
    // Synchronize store filter changes to URL query parameters
    effect(() => {
      const trigger = this.store.urlSyncTrigger();
      if (trigger) {
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: this.store.toQueryParams(),
          replaceUrl: trigger.replaceUrl
        });
      }
    });
  }

  ngOnInit(): void {
    const initialParams = this.route.snapshot.queryParams;
    this.store.initFromQueryParams(initialParams);
  }

  onMinPriceChange(val: string): void {
    const num = val !== '' ? parseFloat(val) : null;
    this.store.onMinPriceInput(num);
  }

  onMaxPriceChange(val: string): void {
    const num = val !== '' ? parseFloat(val) : null;
    this.store.onMaxPriceInput(num);
  }
}
