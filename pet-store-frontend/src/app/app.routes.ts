import { Routes } from '@angular/router';
import { PetCatalogComponent } from './features/catalog/pet-catalog.component';
import { AdminInventoryComponent } from './features/admin/inventory/admin-inventory.component';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    component: PetCatalogComponent,
    title: 'PetStore - Find Your Companion'
  },
  {
    path: 'admin/inventory',
    component: AdminInventoryComponent,
    canActivate: [adminGuard],
    title: 'PetStore - Inventory Management'
  },
  {
    path: '**',
    redirectTo: ''
  }
];
