import { Component, input, output, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { PetSummary } from '../../../core/models/pet.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-pet-card',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, StatusBadgeComponent],
  template: `
    <div class="pet-card" (click)="selectPet.emit(pet().id)">
      <div class="image-wrapper">
        @if (pet().photoUrl) {
          <img [src]="pet().photoUrl" [alt]="pet().name" class="pet-image" loading="lazy" />
        } @else {
          <div class="placeholder-image">
            <span class="placeholder-icon">&#128054;</span>
          </div>
        }
        <div class="status-overlay">
          <app-status-badge [status]="pet().status" />
        </div>
      </div>

      <div class="card-body">
        <div class="category-breed">
          <span class="category">{{ pet().category }}</span> &bull; 
          <span class="breed">{{ pet().breed }}</span>
        </div>
        <h3 class="pet-name">{{ pet().name }}</h3>
        <p class="age-text">{{ ageDisplay() }}</p>

        <div class="card-footer">
          <span class="price">{{ pet().price | currency }}</span>
          <button class="btn btn-secondary btn-sm" (click)="$event.stopPropagation(); selectPet.emit(pet().id)">
            Details
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pet-card {
      background: #ffffff;
      border-radius: var(--radius);
      border: 1px solid var(--border);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .pet-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg);
    }
    .image-wrapper {
      position: relative;
      width: 100%;
      height: 220px;
      background-color: #f1f5f9;
      overflow: hidden;
    }
    .pet-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .placeholder-image {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #e2e8f0;
    }
    .placeholder-icon {
      font-size: 3rem;
      opacity: 0.6;
    }
    .status-overlay {
      position: absolute;
      top: 0.75rem;
      right: 0.75rem;
    }
    .card-body {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      flex-grow: 1;
    }
    .category-breed {
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--text-muted);
      margin-bottom: 0.25rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .pet-name {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-main);
      margin-bottom: 0.25rem;
    }
    .age-text {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin-bottom: 1rem;
    }
    .card-footer {
      margin-top: auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid var(--border);
      padding-top: 0.75rem;
    }
    .price {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--primary);
    }
  `]
})
export class PetCardComponent {
  readonly pet = input.required<PetSummary>();
  readonly selectPet = output<number>();

  readonly ageDisplay = computed(() => {
    const months = this.pet().ageMonths;
    if (months < 12) {
      return `${months} month${months === 1 ? '' : 's'} old`;
    }
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (remainingMonths === 0) {
      return `${years} year${years === 1 ? '' : 's'} old`;
    }
    return `${years} yr ${remainingMonths} mo old`;
  });
}
