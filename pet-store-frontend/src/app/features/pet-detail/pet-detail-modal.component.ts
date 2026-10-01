import { Component, input, output, signal, effect, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { PetService } from '../../core/services/pet.service';
import { PetDetail } from '../../core/models/pet.model';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-pet-detail-modal',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, StatusBadgeComponent],
  template: `
    @if (petId() != null) {
      <div class="modal-overlay" (click)="close.emit()">
        <div class="modal-content detail-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Pet Profile Details</h3>
            <button class="close-btn" (click)="close.emit()">&times;</button>
          </div>

          <div class="modal-body">
            @if (isLoading()) {
              <div class="loading-state">Loading profile details...</div>
            } @else {
              @if (pet(); as p) {
                <div class="detail-grid">
                  <div class="detail-image-wrapper">
                    @if (p.photoUrl) {
                      <img [src]="p.photoUrl" [alt]="p.name" class="detail-image" />
                    } @else {
                      <div class="placeholder-detail">&#128054;</div>
                    }
                  </div>

                  <div class="detail-info">
                    <div class="detail-header-row">
                      <h2 class="name">{{ p.name }}</h2>
                      <app-status-badge [status]="p.status" />
                    </div>

                    <p class="taxonomy">{{ p.category }} &bull; {{ p.breed }}</p>
                    <p class="price">{{ p.price | currency }}</p>

                    <div class="meta-block">
                      <div class="meta-item">
                        <span class="label">Age:</span>
                        <span class="value">{{ p.ageMonths }} months</span>
                      </div>
                      <div class="meta-item">
                        <span class="label">Listed on:</span>
                        <span class="value">{{ p.createdAt | date:'mediumDate' }}</span>
                      </div>
                    </div>

                    <div class="description-section">
                      <h4>About {{ p.name }}</h4>
                      <p class="description">{{ p.description || 'No specific description provided.' }}</p>
                    </div>
                  </div>
                </div>
              }
            }
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="close.emit()">Close</button>
          </div>
        </div>
      </div>
    }
  `,
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

  readonly petId = input<number | null>(null);
  readonly close = output<void>();

  readonly pet = signal<PetDetail | null>(null);
  readonly isLoading = signal<boolean>(false);

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
