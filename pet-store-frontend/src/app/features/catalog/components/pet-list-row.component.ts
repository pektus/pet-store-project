import { Component, input, output, computed, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { PetSummary } from '../../../core/models/pet.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { CartStore } from '../../../core/stores/cart.store';

@Component({
  selector: 'app-pet-list-row',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, StatusBadgeComponent],
  templateUrl: './pet-list-row.component.html',
  styles: [`
    .list-row {
      display: grid;
      grid-template-columns: 60px 2fr 1fr 1fr 1fr auto;
      align-items: center;
      gap: 1.25rem;
      padding: 0.875rem 1.25rem;
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: 8px;
      margin-bottom: 0.75rem;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .list-row:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
    }
    .thumbnail-wrapper {
      width: 50px;
      height: 50px;
      border-radius: 6px;
      overflow: hidden;
      background: #e2e8f0;
    }
    .thumbnail {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .placeholder-thumb {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }
    .name {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-main);
    }
    .category-breed {
      font-size: 0.8125rem;
      color: var(--text-muted);
    }
    .age-cell, .price-cell {
      font-size: 0.9375rem;
    }
    .price {
      font-weight: 700;
      color: var(--primary);
    }
    .action-cell {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }
    .btn-adopt {
      background-color: var(--primary);
      color: #ffffff;
    }
    @media (max-width: 768px) {
      .list-row {
        grid-template-columns: 50px 1fr auto;
      }
      .age-cell, .status-cell {
        display: none;
      }
    }
  `]
})
export class PetListRowComponent {
  readonly cartStore = inject(CartStore);

  readonly pet = input.required<PetSummary>();
  readonly selectPet = output<number>();

  adoptPet(): void {
    if (this.cartStore.isPetInCart(this.pet().id)) {
      this.cartStore.isDrawerOpen.set(true);
    } else {
      this.cartStore.addItem('PET', this.pet().id, 1);
    }
  }

  readonly ageDisplay = computed(() => {
    const months = this.pet().ageMonths;
    if (months < 12) return `${months} mo`;
    const years = Math.floor(months / 12);
    const remainder = months % 12;
    return remainder > 0 ? `${years}y ${remainder}m` : `${years} yr`;
  });
}
