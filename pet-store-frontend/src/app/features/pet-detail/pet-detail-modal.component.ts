import { Component, input, output, signal, effect, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { PetService } from '../../core/services/pet.service';
import { PetDetail } from '../../core/models/pet.model';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { CartStore } from '../../core/stores/cart.store';

@Component({
  selector: 'app-pet-detail-modal',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, StatusBadgeComponent],
  templateUrl: './pet-detail-modal.component.html',
  styles: [`
    .detail-modal {
      max-width: 720px;
    }
    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }
    .detail-image-wrapper {
      height: 300px;
      border-radius: 8px;
      overflow: hidden;
      background: #f1f5f9;
    }
    .detail-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .placeholder-detail {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 4rem;
      background: #e2e8f0;
    }
    .detail-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.25rem;
    }
    .name {
      font-size: 1.5rem;
      font-weight: 700;
    }
    .taxonomy {
      font-size: 0.9375rem;
      color: var(--text-muted);
      margin-bottom: 0.75rem;
    }
    .price {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--primary);
      margin-bottom: 1rem;
    }
    .meta-block {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 0.75rem 0;
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
      margin-bottom: 1rem;
    }
    .meta-item {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
    }
    .label {
      color: var(--text-muted);
    }
    .value {
      font-weight: 500;
    }
    .description-section h4 {
      font-size: 0.9375rem;
      margin-bottom: 0.5rem;
    }
    .description {
      font-size: 0.875rem;
      color: #334155;
      line-height: 1.6;
    }
    .close-btn {
      font-size: 1.5rem;
      color: var(--text-muted);
    }
    .loading-state {
      padding: 3rem;
      text-align: center;
      color: var(--text-muted);
    }
    @media (max-width: 640px) {
      .detail-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class PetDetailModalComponent {
  private readonly petService = inject(PetService);
  readonly cartStore = inject(CartStore);

  readonly petId = input<number | null>(null);
  readonly close = output<void>();

  readonly pet = signal<PetDetail | null>(null);
  readonly isLoading = signal<boolean>(false);

  adoptPet(pet: PetDetail): void {
    if (this.cartStore.isPetInCart(pet.id)) {
      this.close.emit();
      this.cartStore.isDrawerOpen.set(true);
    } else {
      this.cartStore.addItem('PET', pet.id, 1);
    }
  }

  constructor() {
    effect(() => {
      const id = this.petId();
      if (id != null) {
        this.loadPet(id);
      } else {
        this.pet.set(null);
      }
    });
  }

  private loadPet(id: number): void {
    this.isLoading.set(true);
    this.petService.getPetById(id).subscribe({
      next: (data: PetDetail) => {
        this.pet.set(data);
        this.isLoading.set(false);
      },
      error: (err: unknown) => {
        console.error('Failed to load pet details', err);
        this.isLoading.set(false);
      }
    });
  }
}
