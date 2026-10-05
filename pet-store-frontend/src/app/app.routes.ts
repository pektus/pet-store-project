import { Routes } from '@angular/router';
import { PetCatalogComponent } from './features/catalog/pet-catalog.component';
import { SupplyCatalogComponent } from './features/catalog/supply-catalog.component';
import { CheckoutComponent } from './features/checkout/checkout.component';
import { CustomerOrdersComponent } from './features/orders/customer-orders.component';
import { AdminOrdersComponent } from './features/admin/orders/admin-orders.component';
import { AdminInventoryComponent } from './features/admin/inventory/admin-inventory.component';
import { AdminReportsComponent } from './features/admin/reports/admin-reports.component';
import { CustomerRegistrationComponent } from './features/auth/customer-registration/customer-registration.component';
import { EmailVerificationComponent } from './features/auth/email-verification/email-verification.component';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';

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
    path: 'checkout',
    component: CheckoutComponent,
    canActivate: [authGuard],
    title: 'PetStore - Secure Checkout'
  },
  {
    path: 'orders',
    component: CustomerOrdersComponent,
    canActivate: [authGuard],
    title: 'PetStore - My Orders'
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
    path: 'admin/orders',
    component: AdminOrdersComponent,
    canActivate: [adminGuard],
    title: 'PetStore - Order Fulfillment Dashboard'
  },
  {
    path: 'admin/reports',
    component: AdminReportsComponent,
    canActivate: [adminGuard],
    title: 'PetStore - Financial & Analytics Reports'
  },
  {
    path: '**',
    redirectTo: ''
  }
];
