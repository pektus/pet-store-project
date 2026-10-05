import { Routes } from '@angular/router';
import { PetCatalogComponent } from './features/catalog/pet-catalog.component';
import { SupplyCatalogComponent } from './features/catalog/supply-catalog.component';
import { AdminInventoryComponent } from './features/admin/inventory/admin-inventory.component';
import { CustomerRegistrationComponent } from './features/auth/customer-registration/customer-registration.component';
import { EmailVerificationComponent } from './features/auth/email-verification/email-verification.component';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    component: PetCatalogComponent,
    title: 'PetStore - Find Your Companion'
  },
  {
    path: 'supplies',
    component: SupplyCatalogComponent,
    title: 'PetStore - Pet Care & Supplies'
  },
  {
    path: 'register',
    component: CustomerRegistrationComponent,
    title: 'PetStore - Create Customer Account'
  },
  {
    path: 'verify',
    component: EmailVerificationComponent,
    title: 'PetStore - Verify Email'
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
