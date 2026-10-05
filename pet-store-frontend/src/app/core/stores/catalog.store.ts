import { Injectable, signal, computed, inject } from '@angular/core';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { PetService } from '../services/pet.service';
import { PetSummary } from '../models/pet.model';

export interface ActiveFilter {
  key: 'search' | 'category' | 'breed' | 'price';
  label: string;
}

export interface FilterUrlSyncEvent {
  replaceUrl: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CatalogStore {
  private readonly petService = inject(PetService);

  // Raw user inputs (instant UI binding via Signal Forms)
  readonly rawSearchInput = signal<string>('');
  readonly rawMinPrice = signal<number | null>(null);
  readonly rawMaxPrice = signal<number | null>(null);

  // Effective filtered values (used for queries)
  readonly searchTerm = signal<string>('');
  readonly selectedCategory = signal<string>('');
  readonly selectedBreed = signal<string>('');
  readonly minPrice = signal<number | null>(null);
  readonly maxPrice = signal<number | null>(null);
  readonly sortOption = signal<string>('createdAt,desc');
  readonly currentPage = signal<number>(0);
  readonly pageSize = signal<number>(12);
  readonly viewMode = signal<'grid' | 'list'>('grid');

  // Query Results Signals
  readonly pets = signal<PetSummary[]>([]);
  readonly totalElements = signal<number>(0);
  readonly totalPages = signal<number>(0);
  readonly isLoading = signal<boolean>(false);

  // Taxonomy Lists
  readonly categories = signal<string[]>([]);
  readonly breeds = signal<string[]>([]);

  // URL sync notify signal
  readonly urlSyncTrigger = signal<FilterUrlSyncEvent | null>(null);

  // Debouncing RxJS streams for Signal Forms inputs (300ms)
  private readonly searchInput$ = new Subject<string>();
  private readonly priceInput$ = new Subject<{ min: number | null; max: number | null }>();

  // Derived Filter States
  readonly hasActiveFilters = computed(() => {
    return !!(
      this.searchTerm().trim() ||
      this.selectedCategory() ||
      this.selectedBreed() ||
      this.minPrice() != null ||
      this.maxPrice() != null
    );
  });

  readonly activeFilters = computed<ActiveFilter[]>(() => {
    const list: ActiveFilter[] = [];
    if (this.selectedCategory()) {
      list.push({ key: 'category', label: `Category: ${this.selectedCategory()}` });
    }
    if (this.selectedBreed()) {
      list.push({ key: 'breed', label: `Breed: ${this.selectedBreed()}` });
    }
    if (this.searchTerm().trim()) {
      list.push({ key: 'search', label: `Search: "${this.searchTerm().trim()}"` });
    }
    if (this.minPrice() != null || this.maxPrice() != null) {
      const min = this.minPrice() != null ? `$${this.minPrice()}` : '$0';
      const max = this.maxPrice() != null ? `$${this.maxPrice()}` : 'any';
      list.push({ key: 'price', label: `Price: ${min} - ${max}` });
    }
    return list;
  });

  constructor() {
    // 300ms debounce on keyword search
    this.searchInput$.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      this.searchTerm.set(term);
      this.currentPage.set(0);
      this.urlSyncTrigger.set({ replaceUrl: true });
      this.loadPets();
    });

    // 300ms debounce on price bounds
    this.priceInput$.pipe(
      debounceTime(300),
      distinctUntilChanged((prev, curr) => prev.min === curr.min && prev.max === curr.max)
    ).subscribe(range => {
      this.minPrice.set(range.min);
      this.maxPrice.set(range.max);
      this.currentPage.set(0);
      this.urlSyncTrigger.set({ replaceUrl: true });
      this.loadPets();
    });
  }

  initFromQueryParams(params: Record<string, string | undefined>): void {
    const search = (params['search'] || '').trim();
    const category = (params['category'] || '').trim();
    const breed = (params['breed'] || '').trim();
    const min = params['minPrice'] != null && params['minPrice'] !== '' ? Number(params['minPrice']) : null;
    const max = params['maxPrice'] != null && params['maxPrice'] !== '' ? Number(params['maxPrice']) : null;
    const sort = (params['sort'] || 'createdAt,desc').trim();
    const page = params['page'] != null && params['page'] !== '' ? Number(params['page']) : 0;

    this.rawSearchInput.set(search);
    this.searchTerm.set(search);

    this.selectedCategory.set(category);
    this.selectedBreed.set(breed);

    this.rawMinPrice.set(min);
    this.minPrice.set(min);

    this.rawMaxPrice.set(max);
    this.maxPrice.set(max);

    this.sortOption.set(sort);
    this.currentPage.set(page);

    this.loadCategories();
    this.loadBreeds();
    this.loadPets();
  }

  toQueryParams(): Record<string, string | number> {
    const params: Record<string, string | number> = {};
    if (this.searchTerm().trim()) params['search'] = this.searchTerm().trim();
    if (this.selectedCategory()) params['category'] = this.selectedCategory();
    if (this.selectedBreed()) params['breed'] = this.selectedBreed();
    if (this.minPrice() != null) params['minPrice'] = this.minPrice()!;
    if (this.maxPrice() != null) params['maxPrice'] = this.maxPrice()!;
    if (this.sortOption() !== 'createdAt,desc') params['sort'] = this.sortOption();
    if (this.currentPage() > 0) params['page'] = this.currentPage();
    return params;
  }

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

  // Instant signal form input handler -> debounces before triggering search
  onSearchInput(term: string): void {
    this.rawSearchInput.set(term);
    this.searchInput$.next(term.trim());
  }

  // Instant category toggle
  setCategory(category: string): void {
    this.selectedCategory.set(category);
    this.selectedBreed.set(''); // reset breed when category changes
    this.currentPage.set(0);
    this.urlSyncTrigger.set({ replaceUrl: true });
    this.loadBreeds();
    this.loadPets();
  }

  // Instant breed toggle
  setBreed(breed: string): void {
    this.selectedBreed.set(breed);
    this.currentPage.set(0);
    this.urlSyncTrigger.set({ replaceUrl: true });
    this.loadPets();
  }

  // Instant price input handlers -> debounces before triggering search
  onMinPriceInput(val: number | null): void {
    this.rawMinPrice.set(val);
    this.priceInput$.next({ min: val, max: this.rawMaxPrice() });
  }

  onMaxPriceInput(val: number | null): void {
    this.rawMaxPrice.set(val);
    this.priceInput$.next({ min: this.rawMinPrice(), max: val });
  }

  setSort(sort: string): void {
    this.sortOption.set(sort);
    this.urlSyncTrigger.set({ replaceUrl: true });
    this.loadPets();
  }

  setPage(page: number): void {
    this.currentPage.set(page);
    // Explicit pagination pushes to browser history (replaceUrl: false)
    this.urlSyncTrigger.set({ replaceUrl: false });
    this.loadPets();
  }

  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode.set(mode);
  }

  removeFilter(key: 'search' | 'category' | 'breed' | 'price'): void {
    switch (key) {
      case 'search':
        this.rawSearchInput.set('');
        this.searchTerm.set('');
        break;
      case 'category':
        this.selectedCategory.set('');
        this.selectedBreed.set('');
        this.loadBreeds();
        break;
      case 'breed':
        this.selectedBreed.set('');
        break;
      case 'price':
        this.rawMinPrice.set(null);
        this.minPrice.set(null);
        this.rawMaxPrice.set(null);
        this.maxPrice.set(null);
        break;
    }
    this.currentPage.set(0);
    this.urlSyncTrigger.set({ replaceUrl: true });
    this.loadPets();
  }

  resetFilters(): void {
    this.rawSearchInput.set('');
    this.searchTerm.set('');
    this.selectedCategory.set('');
    this.selectedBreed.set('');
    this.rawMinPrice.set(null);
    this.minPrice.set(null);
    this.rawMaxPrice.set(null);
    this.maxPrice.set(null);
    this.currentPage.set(0);
    this.urlSyncTrigger.set({ replaceUrl: true });
    this.loadBreeds();
    this.loadPets();
  }
}
