import { Component, input, output, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupplyService } from '../../../core/services/supply.service';
import { MediaService } from '../../../core/services/media.service';
import { Supply, SupplyCategory, SupplyStatus } from '../../../core/models/supply.model';

@Component({
  selector: 'app-admin-supply-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-supply-form.component.html',
  styles: [`
    .form-modal {
      max-width: 620px;
    }
    .form-body {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .form-row {
      display: flex;
      gap: 1rem;
    }
    .flex-1 {
      flex: 1;
    }
    .form-group label {
      display: block;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 0.25rem;
    }
    .form-control {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--border);
      border-radius: 6px;
      outline: none;
    }
    .form-control:focus {
      border-color: var(--primary);
    }
    .media-upload-area {
      border: 2px dashed var(--border);
      border-radius: 8px;
      padding: 1rem;
      text-align: center;
      background: #f8fafc;
    }
    .file-input {
      display: none;
    }
    .upload-label {
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-muted);
    }
    .upload-icon {
      font-size: 2rem;
    }
    .preview-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1.5rem;
    }
    .preview-img {
      width: 120px;
      height: 90px;
      object-fit: cover;
      border-radius: 6px;
    }
    .error-alert {
      padding: 0.75rem;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 6px;
      color: var(--danger);
      font-size: 0.875rem;
    }
    .close-btn {
      font-size: 1.5rem;
      color: var(--text-muted);
    }
  `]
})
export class AdminSupplyFormComponent {
  private readonly supplyService = inject(SupplyService);
  private readonly mediaService = inject(MediaService);

  readonly isOpen = input.required<boolean>();
  readonly supplyToEdit = input<Supply | null>(null);

  readonly close = output<void>();
  readonly saved = output<void>();

  // Exclusive Signal Forms: Field State Signals
  readonly sku = signal<string>('');
  readonly name = signal<string>('');
  readonly category = signal<SupplyCategory>('FOOD');
  readonly price = signal<number>(19.99);
  readonly stockQuantity = signal<number>(10);
  readonly lowStockThreshold = signal<number>(5);
  readonly status = signal<SupplyStatus>('ACTIVE');
  readonly description = signal<string>('');
  readonly photoUrl = signal<string | null>(null);

  readonly isUploading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  constructor() {
    effect(() => {
      const supply = this.supplyToEdit();
      if (supply) {
        this.sku.set(supply.sku);
        this.name.set(supply.name);
        this.category.set(supply.category);
        this.price.set(supply.price);
        this.stockQuantity.set(supply.stockQuantity);
        this.lowStockThreshold.set(supply.lowStockThreshold);
        this.status.set(supply.status);
        this.description.set(supply.description || '');
        this.photoUrl.set(supply.photoUrl || null);
      } else {
        this.resetForm();
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.isUploading.set(true);
    this.errorMessage.set(null);

    this.mediaService.upload(file).subscribe({
      next: res => {
        this.photoUrl.set(res.fileUrl);
        this.isUploading.set(false);
      },
      error: err => {
        this.isUploading.set(false);
        this.errorMessage.set(err.error?.detail || 'Failed to upload photo.');
      }
    });
  }

  removePhoto(): void {
    this.photoUrl.set(null);
  }

  onSubmit(): void {
    if (!this.name().trim() || this.price() < 0) return;

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const editId = this.supplyToEdit()?.id;

    if (editId != null) {
      this.supplyService.updateSupply(editId, {
        name: this.name().trim(),
        category: this.category(),
        price: Number(this.price()),
        lowStockThreshold: Number(this.lowStockThreshold()),
        status: this.status(),
        description: this.description().trim() || undefined,
        photoUrl: this.photoUrl()
      }).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.saved.emit();
          this.close.emit();
        },
        error: err => {
          this.isSaving.set(false);
          this.errorMessage.set(err.error?.detail || err.error?.message || 'Failed to update supply record.');
        }
      });
    } else {
      this.supplyService.createSupply({
        sku: this.sku().trim() || undefined,
        name: this.name().trim(),
        category: this.category(),
        price: Number(this.price()),
        stockQuantity: Number(this.stockQuantity()),
        lowStockThreshold: Number(this.lowStockThreshold()),
        description: this.description().trim() || undefined,
        photoUrl: this.photoUrl()
      }).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.saved.emit();
          this.close.emit();
        },
        error: err => {
          this.isSaving.set(false);
          this.errorMessage.set(err.error?.detail || err.error?.message || 'Failed to create supply record.');
        }
      });
    }
  }

  private resetForm(): void {
    this.sku.set('');
    this.name.set('');
    this.category.set('FOOD');
    this.price.set(19.99);
    this.stockQuantity.set(10);
    this.lowStockThreshold.set(5);
    this.status.set('ACTIVE');
    this.description.set('');
    this.photoUrl.set(null);
    this.errorMessage.set(null);
  }
}
