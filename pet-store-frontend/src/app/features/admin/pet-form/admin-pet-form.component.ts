import { Component, input, output, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PetService } from '../../../core/services/pet.service';
import { MediaService } from '../../../core/services/media.service';
import { PetDetail, PetStatus } from '../../../core/models/pet.model';

@Component({
  selector: 'app-admin-pet-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-pet-form.component.html',
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
export class AdminPetFormComponent {
  private readonly petService = inject(PetService);
  private readonly mediaService = inject(MediaService);

  readonly isOpen = input.required<boolean>();
  readonly petToEdit = input<PetDetail | null>(null);

  readonly close = output<void>();
  readonly saved = output<void>();

  readonly name = signal<string>('');
  readonly category = signal<string>('Dog');
  readonly breed = signal<string>('');
  readonly ageMonths = signal<number>(12);
  readonly price = signal<number>(100);
  readonly status = signal<PetStatus>('AVAILABLE');
  readonly description = signal<string>('');
  readonly photoUrl = signal<string | null>(null);

  readonly isUploading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  constructor() {
    effect(() => {
      const pet = this.petToEdit();
      if (pet) {
        this.name.set(pet.name);
        this.category.set(pet.category);
        this.breed.set(pet.breed);
        this.ageMonths.set(pet.ageMonths);
        this.price.set(pet.price);
        this.status.set(pet.status);
        this.description.set(pet.description || '');
        this.photoUrl.set(pet.photoUrl);
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
    if (!this.name() || !this.breed()) return;

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const payload = {
      name: this.name().trim(),
      category: this.category(),
      breed: this.breed().trim(),
      ageMonths: Number(this.ageMonths()),
      price: Number(this.price()),
      status: this.status(),
      description: this.description().trim() || null,
      photoUrl: this.photoUrl()
    };

    const editId = this.petToEdit()?.id;

    const operation$ = editId != null
      ? this.petService.updatePet(editId, payload)
      : this.petService.createPet(payload);

    operation$.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.saved.emit();
        this.close.emit();
      },
      error: err => {
        this.isSaving.set(false);
        this.errorMessage.set(err.error?.detail || 'Failed to save pet record.');
      }
    });
  }

  private resetForm(): void {
    this.name.set('');
    this.category.set('Dog');
    this.breed.set('');
    this.ageMonths.set(12);
    this.price.set(100);
    this.status.set('AVAILABLE');
    this.description.set('');
    this.photoUrl.set(null);
    this.errorMessage.set(null);
  }
}
