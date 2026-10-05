# Slice 2: Pet & Supply Search & Exploration (`aidlc-docs/slices/slice-2-search.md`)

> **AI-DLC Slice Lifecycle Phase:** `[P] PLAN & [A] ASK`  
> **Status:** `[V] VALIDATION GATE - PENDING HUMAN REVIEW`  
> **Slice Focus:** Multi-Criteria Dynamic Search, Scoped Breed Taxonomy, Debounced Signal Forms, URL State Sync

---

## 1. Slice Overview & Scope

Slice 2 delivers an enterprise-grade, responsive exploration experience for the Pet Store platform. It fulfills the user requirement for fast, dynamic search across **pet types (categories)** and **breeds**, keyword searching (name, breed, description), price filtering, and sort preferences.

### Key Objectives:
1. **Database Search Indexing (Flyway `V5`):**
   - Add composite database indexes on `pets(category_id, breed, status)` and `pets(status, price)` to guarantee sub-millisecond query execution.
   - Ensure case-insensitive index coverage for search predicates.
2. **Backend Search & Taxonomy APIs:**
   - Verify and optimize `GET /api/pets` with dynamic Spring Data JPA Specifications (`PetSpecification`).
   - Enhance `GET /api/pets/breeds` to return distinct breeds scoped to selected pet categories.
   - Ensure public access to search and catalog endpoints in `SecurityConfig`.
3. **Angular 24 Signal Forms Search Experience:**
   - Debounced Signal-first search input (300ms debounce) eliminating server flooding without sacrificing instant UI responsiveness.
   - Reactive Scoped Breed Selector: Breeds automatically re-scope when a category is selected.
   - Active Filter Chips: Individual filter dismissal tags (e.g. `[Dog ✕]`, `[Golden Retriever ✕]`).
   - Deep-linking & URL Synchronization: Query parameters (`?search=...&category=...&breed=...`) sync with signals for bookmarkable and shareable search results.
4. **Automated Verification:**
   - Backend unit tests for search specifications and breed taxonomy queries.
   - Frontend production build verification and signal state testing.

---

## 2. Slice Clarifications & Targeted Questions (For User Review)

> ✍️ **Instructions for User:** Please review the questions below. You can edit this file directly to add your input under `**User Answer / Decision:**`.

* **Q-S2.1: Debounce Duration for Keyword Search:**  
  What is the desired debounce delay when typing in the search bar?  
  - *Architect Recommendation:* 300 milliseconds. This gives an optimal balance between snappy feedback and avoiding unnecessary HTTP calls on every keystroke.  
  - **User Answer / Decision:** `[Adopt recommendation (300ms) / Specify custom duration]`

* **Q-S2.2: Deep-linking & Browser History:**  
  Should filter adjustments create new browser history entries (enabling Back/Forward navigation between searches) or replace the current URL state?  
  - *Architect Recommendation:* URL replacement (`replaceUrl: true`) during typing/filtering to avoid cluttering the browser history stack, with URL push on explicit pagination.  
  - **User Answer / Decision:** `[Adopt recommendation / Specify custom behavior]`

---

## 3. Technical Contract & Architecture Specifications

### 3.1. REST Endpoints Specification

#### `GET /api/pets` (Public)
Query Parameters:
- `search` (optional string): Case-insensitive match on pet name, breed, or description.
- `category` (optional string): Category name filter (e.g., `Dog`, `Cat`, `Bird`).
- `breed` (optional string): Breed filter (e.g., `Golden Retriever`, `Persian`).
- `minPrice` / `maxPrice` (optional decimal): Price range filtering.
- `page` (integer, default 0): Zero-based page index.
- `size` (integer, default 12, max 100): Page size.
- `sort` (string, default `createdAt,desc`): Property and direction (`price,asc`, `name,asc`, etc.).

#### `GET /api/pets/categories` (Public)
Returns a list of all distinct category names:
```json
["Bird", "Cat", "Dog", "Fish", "Reptile", "Small Animal"]
```

#### `GET /api/pets/breeds?category={category}` (Public)
Returns distinct breeds, optionally filtered by category:
```json
["Beagle", "Bulldog", "German Shepherd", "Golden Retriever", "Poodle"]
```

---

### 3.2. Database Indexing Plan (`V5__pet_search_optimization_indexes.sql`)

```sql
-- Composite index for category and breed search
CREATE INDEX IF NOT EXISTS idx_pets_category_breed_status 
ON pets (category_id, breed, status);

-- Composite index for price filtering and sorting
CREATE INDEX IF NOT EXISTS idx_pets_status_price 
ON pets (status, price);

-- Index on created_at for default sorting
CREATE INDEX IF NOT EXISTS idx_pets_status_created_at 
ON pets (status, created_at DESC);
```

---

### 3.3. Angular 24 Signal Forms Implementation Plan

- **Exclusive Signal Forms Architecture:**
  - `searchTerm = signal<string>('')`
  - `selectedCategory = signal<string>('')`
  - `selectedBreed = signal<string>('')`
  - `minPrice = signal<number | null>(null)`
  - `maxPrice = signal<number | null>(null)`
  - `debouncedSearchTerm = toSignal(toObservable(this.searchTerm).pipe(debounceTime(300)), ...)`
  - `activeFilterList = computed(...)`: List of active filters with label and remove callback for chips.
  - Signal effect syncing filters to `Router.navigate([], { queryParams: ... })`.

---

## 4. Multi-Developer Work Breakdown & Dependencies

- **Developer 1 (Database & Backend):**
  - Create Flyway migration `V5__pet_search_optimization_indexes.sql`.
  - Add repository test cases for category-scoped breeds and search specifications.
- **Developer 2 (Frontend Signal Forms & Catalog UX):**
  - Implement debounced signals and active filter dismiss chips in `pet-catalog.component.ts`.
  - Wire query parameter bidirectional synchronization in `CatalogStore`.

---

## 5. Human Validation & Approval Gate

```
================================================================================
                         HUMAN APPROVAL GATE - SLICE 2 [V]
================================================================================
 Current State: SLICE 2 SPECIFICATION DRAFTED - AWAITING HUMAN REVIEW & APPROVAL
 Action Required:
   1. Review Slice 2 search architecture, indexing, and Signal Forms design.
   2. Edit your decisions into Q-S2.1 and Q-S2.2 above (or adopt recommendations).
   3. When ready, state "Approved" (or "Approved Slice 2") in chat to begin Slice 2 [E] Execution.
================================================================================
```
