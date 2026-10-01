import { Injectable, signal, computed, inject } from '@angular/core';
import { PetService } from '../services/pet.service';
import { PetSummary } from '../models/pet.model';

@Injectable({
  providedIn: 'root'
})
export class CatalogStore {
  private readonly petService = inject(PetService);

  readonly searchTerm = signal<string>('');
  readonly selectedCategory = signal<string>('');
  readonly selectedBreed = signal<string>('');
  readonly minPrice = signal<number | null>(null);
  readonly maxPrice = signal<number | null>(null);
  readonly sortOption = signal<string>('createdAt,desc');
  readonly currentPage = signal<number>(0);
  readonly pageSize = signal<number>(12);
  readonly viewMode = signal<'grid' | 'list'>('grid');

  readonly pets = signal<PetSummary[]>([]);
  readonly totalElements = signal<number>(0);
  readonly totalPages = signal<number>(0);
  readonly isLoading = signal<boolean>(false);

  readonly categories = signal<string[]>([]);
  readonly breeds = signal<string[]>([]);

  readonly hasActiveFilters = computed(() => {
    return !!(
      this.searchTerm().trim() ||
      this.selectedCategory() ||
      this.selectedBreed() ||
      this.minPrice() != null ||
      this.maxPrice() != null
    );
  });

  loadCategories(): void {
    this.petService.getCategories().subscribe({
      next: cats => this.categories.set(cats),
      error: err => console.error('Failed to load categories', err)
    });
  }

  loadBreeds(): void {
    this.petService.getBreeds(this.selectedCategory()).subscribe({
      next: b => this.breeds.set(b),
      error: err => console.error('Failed to load breeds', err)
    });
  }

  loadPets(): void {
    this.isLoading.set(true);

    this.petService.getPets({
      search: this.searchTerm().trim() || undefined,
      category: this.selectedCategory() || undefined,
      breed: this.selectedBreed() || undefined,
      minPrice: this.minPrice(),
      maxPrice: this.maxPrice(),
      page: this.currentPage(),
      size: this.pageSize(),
      sort: this.sortOption()
    }).subscribe({
      next: response => {
        this.pets.set(response.content);
        this.totalElements.set(response.totalElements);
        this.totalPages.set(response.totalPages);
        this.isLoading.set(false);
      },
      error: err => {
        console.error('Failed to fetch pets', err);
        this.isLoading.set(false);
      }
    });
  }

  setSearch(term: string): void {
    this.searchTerm.set(term);
    this.currentPage.set(0);
    this.loadPets();
  }

  setCategory(category: string): void {
    this.selectedCategory.set(category);
    this.selectedBreed.set(''); // reset breed when category changes
    this.currentPage.set(0);
    this.loadBreeds();
    this.loadPets();
  }

  setBreed(breed: string): void {
    this.selectedBreed.set(breed);
    this.currentPage.set(0);
    this.loadPets();
  }

  setPriceRange(min: number | null, max: number | null): void {
    this.minPrice.set(min);
    this.maxPrice.set(max);
    this.currentPage.set(0);
    this.loadPets();
  }

  setSort(sort: string): void {
    this.sortOption.set(sort);
    this.loadPets();
  }

  setPage(page: number): void {
    this.currentPage.set(page);
    this.loadPets();
  }

  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode.set(mode);
  }

  resetFilters(): void {
    this.searchTerm.set('');
    this.selectedCategory.set('');
    this.selectedBreed.set('');
    this.minPrice.set(null);
    this.maxPrice.set(null);
    this.currentPage.set(0);
    this.loadBreeds();
    this.loadPets();
  }
}
