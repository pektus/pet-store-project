import { Component, input, output, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { PetSummary } from '../../../core/models/pet.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-pet-list-row',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, StatusBadgeComponent],
  template: `
    <div class="list-row" (click)="selectPet.emit(pet().id)">
      <div class="thumbnail-wrapper">
        @if (pet().photoUrl) {
          <img [src]="pet().photoUrl" [alt]="pet().name" class="thumbnail" />
        } @else {
          <div class="placeholder-thumb">&#128054;</div>
        }
      </div>

      <div class="info-cell">
        <h4 class="name">{{ pet().name }}</h4>
        <span class="category-breed">{{ pet().category }} &bull; {{ pet().breed }}</span>
      </div>

      <div class="age-cell">
        <span>{{ ageDisplay() }}</span>
      </div>

      <div class="status-cell">
        <app-status-badge [status]="pet().status" />
      </div>

      <div class="price-cell">
        <span class="price">{{ pet().price | currency }}</span>
      </div>

      <div class="action-cell">
        <button class="btn btn-secondary btn-sm" (click)="$event.stopPropagation(); selectPet.emit(pet().id)">
          View
        </button>
      </div>
    </div>
  `,
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
  readonly pet = input.required<PetSummary>();
  readonly selectPet = output<number>();

  readonly ageDisplay = computed(() => {
    const months = this.pet().ageMonths;
    if (months < 12) return `${months} mo`;
    const years = Math.floor(months / 12);
    const remainder = months % 12;
    return remainder > 0 ? `${years}y ${remainder}m` : `${years} yr`;
  });
}
