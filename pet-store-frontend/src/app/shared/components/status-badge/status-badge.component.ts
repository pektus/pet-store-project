import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PetStatus } from '../../../core/models/pet.model';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge" [ngClass]="badgeClass()">
      {{ status() }}
    </span>
  `,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.625rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.025em;
      text-transform: uppercase;
    }
    .badge-available {
      background-color: #dcfce7;
      color: #15803d;
    }
    .badge-pending {
      background-color: #fef3c7;
      color: #b45309;
    }
    .badge-adopted {
      background-color: #e2e8f0;
      color: #475569;
    }
  `]
})
export class StatusBadgeComponent {
  readonly status = input.required<PetStatus>();

  readonly badgeClass = computed(() => {
    switch (this.status()) {
      case 'AVAILABLE':
        return 'badge-available';
      case 'PENDING':
        return 'badge-pending';
      case 'ADOPTED':
        return 'badge-adopted';
      default:
        return '';
    }
  });
}
