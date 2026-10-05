import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupplyService } from '../../core/services/supply.service';
import { Supply, SupplyCategory } from '../../core/models/supply.model';
import { CartStore } from '../../core/stores/cart.store';

@Component({
  selector: 'app-supply-catalog',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, FormsModule],
  templateUrl: './supply-catalog.component.html',
  styles: [`
    .supplies-page {
      padding: 2rem 1rem 4rem 1rem;
    }
    .catalog-header {
      margin-bottom: 2rem;
    }
    .page-title {
      font-size: 2rem;
      font-weight: 800;
      color: var(--text-main);
      margin-bottom: 0.5rem;
    }
    .page-subtitle {
      font-size: 1rem;
      color: var(--text-muted);
    }
    .filter-card {
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.25rem;
      margin-bottom: 2rem;
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .search-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
    }
    .search-icon {
      position: absolute;
      left: 1rem;
      color: var(--text-muted);
      font-size: 1.1rem;
    }
    .search-input {
      width: 100%;
      padding: 0.75rem 1rem 0.75rem 2.75rem;
      border: 1px solid var(--border);
      border-radius: 8px;
      font-size: 0.9375rem;
      transition: border-color 0.15s ease;
    }
    .search-input:focus {
      outline: none;
      border-color: var(--primary);
    }
    .category-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .chip {
      background: #f1f5f9;
      border: 1px solid var(--border);
      border-radius: 9999px;
      padding: 0.35rem 0.85rem;
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--text-main);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .chip:hover {
      background: #e2e8f0;
    }
    .chip.active {
      background: var(--primary);
      color: #ffffff;
      border-color: var(--primary);
    }
    .supplies-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 1.5rem;
    }
    .supply-card {
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .supply-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg);
    }
    .supply-card.out-of-stock {
      opacity: 0.7;
    }
    .image-wrapper {
      position: relative;
      height: 190px;
      background: #f8fafc;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .supply-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .placeholder-image {
      font-size: 3.5rem;
    }
    .badge-stock {
      position: absolute;
      top: 0.75rem;
      right: 0.75rem;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
    }
    .badge-stock.out {
      background: #fee2e2;
      color: #991b1b;
    }
    .badge-stock.low {
      background: #fef3c7;
      color: #92400e;
    }
    .card-body {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      flex-grow: 1;
    }
    .sku-category {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 0.35rem;
    }
    .cat-tag {
      text-transform: uppercase;
      color: var(--primary);
    }
    .sku-tag {
      font-family: monospace;
    }
    .supply-name {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-main);
      margin-bottom: 0.5rem;
    }
    .description {
      font-size: 0.8125rem;
      color: var(--text-muted);
      line-height: 1.4;
      margin-bottom: 1rem;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .card-footer {
      margin-top: auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 0.75rem;
      border-top: 1px solid var(--border);
    }
    .price {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--primary);
    }
    .btn-add {
      background: var(--primary);
      color: #ffffff;
      padding: 0.4rem 0.85rem;
    }
    .btn-disabled {
      background: #e2e8f0;
      color: #94a3b8;
      border: none;
      cursor: not-allowed;
      padding: 0.4rem 0.85rem;
      border-radius: 6px;
    }
    .loading-state, .empty-state {
      padding: 4rem 1rem;
      text-align: center;
      color: var(--text-muted);
    }
    .empty-icon {
      font-size: 3.5rem;
      margin-bottom: 1rem;
      opacity: 0.6;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e2e8f0;
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
export class SupplyCatalogComponent implements OnInit {
  private readonly supplyService = inject(SupplyService);
  private readonly cartStore = inject(CartStore);

  readonly supplies = signal<Supply[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly searchTerm = signal<string>('');
  readonly selectedCategory = signal<string>('');

  readonly categories: SupplyCategory[] = [
    'FOOD',
    'TOYS',
    'HEALTHCARE',
    'ACCESSORIES',
    'GROOMING',
    'BEDDING',
    'OTHER'
  ];

  ngOnInit(): void {
    this.loadSupplies();
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
    this.loadSupplies();
  }

  setCategory(cat: string): void {
    this.selectedCategory.set(cat);
    this.loadSupplies();
  }

  loadSupplies(): void {
    this.isLoading.set(true);
    this.supplyService.getSupplies({
      search: this.searchTerm() || undefined,
      category: this.selectedCategory() || undefined,
      size: 24,
      sort: 'name,asc'
    }).subscribe({
      next: res => {
        this.supplies.set(res.content);
        this.isLoading.set(false);
      },
      error: err => {
        console.error('Failed to load supplies', err);
        this.isLoading.set(false);
      }
    });
  }

  addToCart(supply: Supply): void {
    this.cartStore.addItem('SUPPLY', supply.id, 1);
  }

  formatCategoryName(cat: string): string {
    return cat.charAt(0) + cat.slice(1).toLowerCase();
  }

  getCategoryIcon(category: string): string {
    switch (category) {
      case 'FOOD': return '🥣';
      case 'TOYS': return '🎾';
      case 'HEALTHCARE': return '💊';
      case 'ACCESSORIES': return '🦮';
      case 'GROOMING': return '🧼';
      case 'BEDDING': return '🛏️';
      default: return '📦';
    }
  }
}
