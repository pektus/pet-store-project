import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (totalPages() > 1) {
      <div class="pagination-container">
        <button 
          class="btn btn-secondary btn-sm" 
          [disabled]="!hasPrevious()" 
          (click)="onPrevious()">
          &larr; Previous
        </button>
        <span class="page-indicator">
          Page <strong>{{ displayPage() }}</strong> of <strong>{{ totalPages() }}</strong>
        </span>
        <button 
          class="btn btn-secondary btn-sm" 
          [disabled]="!hasNext()" 
          (click)="onNext()">
          Next &rarr;
        </button>
      </div>
    }
  `,
  styles: [`
    .pagination-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1.5rem;
      margin: 2rem 0;
    }
    .page-indicator {
      font-size: 0.875rem;
      color: var(--text-muted);
    }
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class PaginationComponent {
  readonly currentPage = input.required<number>();
  readonly totalPages = input.required<number>();

  readonly pageChange = output<number>();

  readonly hasPrevious = computed(() => this.currentPage() > 0);
  readonly hasNext = computed(() => this.currentPage() < this.totalPages() - 1);
  readonly displayPage = computed(() => this.currentPage() + 1);

  onPrevious(): void {
    if (this.hasPrevious()) {
      this.pageChange.emit(this.currentPage() - 1);
    }
  }

  onNext(): void {
    if (this.hasNext()) {
      this.pageChange.emit(this.currentPage() + 1);
    }
  }
}
