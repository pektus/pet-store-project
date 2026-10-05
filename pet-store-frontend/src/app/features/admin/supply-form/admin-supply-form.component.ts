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
  template: `
    @if (isOpen()) {
      <div class="modal-overlay" (click)="close.emit()">
        <div class="modal-content form-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ supplyToEdit() ? 'Edit Physical Supply' : 'Add Physical Supply' }}</h3>
            <button class="close-btn" (click)="close.emit()">&times;</button>
          </div>

          <form (ngSubmit)="onSubmit()">
            <div class="modal-body form-body">
              @if (errorMessage()) {
                <div class="error-alert">{{ errorMessage() }}</div>
              }

              <!-- Image Upload Section -->
              <div class="form-group">
                <label>Product Picture</label>
                <div class="media-upload-area">
                  @if (photoUrl()) {
                    <div class="preview-container">
                      <img [src]="photoUrl()" alt="Preview" class="preview-img" />
                      <button type="button" class="btn btn-danger btn-sm remove-photo" (click)="removePhoto()">
                        Remove
                      </button>
                    </div>
                  } @else {
                    <div class="upload-dropzone">
                      <input 
                        type="file" 
                        accept="image/jpeg,image/png,image/webp" 
                        (change)="onFileSelected($event)" 
                        id="supplyFileUpload" 
                        class="file-input" />
                      <label for="supplyFileUpload" class="upload-label">
                        <span class="upload-icon">&#128247;</span>
                        <span>{{ isUploading() ? 'Uploading...' : 'Click to select picture (JPEG, PNG, WebP &le; 5MB)' }}</span>
                      </label>
                    </div>
                  }
                </div>
              </div>

              <div class="form-row">
                <div class="form-group flex-1">
                  <label for="supplyName">Product Name *</label>
                  <input 
                    id="supplyName" 
                    type="text" 
                    required 
                    [ngModel]="name()" 
                    (ngModelChange)="name.set($event)" 
                    name="name" 
                    class="form-control" 
                    placeholder="e.g. Grain-Free Salmon Kibble 10kg" />
                </div>

                <div class="form-group flex-1">
                  <label for="supplySku">SKU (Leave blank to auto-generate)</label>
                  <input 
                    id="supplySku" 
                    type="text" 
                    [ngModel]="sku()" 
                    (ngModelChange)="sku.set($event)" 
                    [disabled]="!!supplyToEdit()"
                    name="sku" 
                    class="form-control" 
                    placeholder="e.g. FOOD-CANINE-001" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group flex-1">
                  <label for="supplyCategory">Category *</label>
                  <select 
                    id="supplyCategory" 
                    [ngModel]="category()" 
                    (ngModelChange)="category.set($event)" 
                    name="category" 
                    class="form-control">
                    <option value="FOOD">FOOD</option>
                    <option value="TOYS">TOYS</option>
                    <option value="HEALTHCARE">HEALTHCARE</option>
                    <option value="ACCESSORIES">ACCESSORIES</option>
                    <option value="GROOMING">GROOMING</option>
                    <option value="BEDDING">BEDDING</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>

                <div class="form-group flex-1">
                  <label for="supplyPrice">Price ($) *</label>
                  <input 
                    id="supplyPrice" 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    required 
                    [ngModel]="price()" 
                    (ngModelChange)="price.set($event)" 
                    name="price" 
                    class="form-control" />
                </div>
              </div>

              <div class="form-row">
                @if (!supplyToEdit()) {
                  <div class="form-group flex-1">
                    <label for="supplyStock">Initial Stock Quantity *</label>
                    <input 
                      id="supplyStock" 
                      type="number" 
                      min="0" 
                      required 
                      [ngModel]="stockQuantity()" 
                      (ngModelChange)="stockQuantity.set($event)" 
                      name="stockQuantity" 
                      class="form-control" />
                  </div>
                }

                <div class="form-group flex-1">
                  <label for="supplyThreshold">Low-Stock Alert Threshold *</label>
                  <input 
                    id="supplyThreshold" 
                    type="number" 
                    min="0" 
                    required 
                    [ngModel]="lowStockThreshold()" 
                    (ngModelChange)="lowStockThreshold.set($event)" 
                    name="lowStockThreshold" 
                    class="form-control" />
                </div>

                @if (supplyToEdit()) {
                  <div class="form-group flex-1">
                    <label for="supplyStatus">Inventory Status *</label>
                    <select 
                      id="supplyStatus" 
                      [ngModel]="status()" 
                      (ngModelChange)="status.set($event)" 
                      name="status" 
                      class="form-control">
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="OUT_OF_STOCK">OUT_OF_STOCK</option>
                      <option value="DISCONTINUED">DISCONTINUED</option>
                    </select>
                  </div>
                }
              </div>

              <div class="form-group">
                <label for="supplyDesc">Description</label>
                <textarea 
                  id="supplyDesc" 
                  rows="3" 
                  [ngModel]="description()" 
                  (ngModelChange)="description.set($event)" 
                  name="description" 
                  class="form-control" 
                  placeholder="Ingredients, sizing, usage specifications..."></textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="close.emit()">Cancel</button>
              <button 
                type="submit" 
                class="btn btn-primary" 
                [disabled]="isSaving() || isUploading() || !name().trim() || price() < 0">
                {{ isSaving() ? 'Saving...' : (supplyToEdit() ? 'Update Supply' : 'Create Supply') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
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
