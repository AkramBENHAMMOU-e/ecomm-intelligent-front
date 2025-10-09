import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProductList } from './components/product-list/product-list';
import { ProductDetailComponent } from './components/product-detail/product-detail';
import { CheckoutComponent } from './components/checkout/checkout';
import { Dashboard } from './components/dashboard/dashboard';
import { AddProduct } from './components/add-product/add-product';
import { OrderManagement } from './components/dashboard/order-management';
import { CustomerManagementComponent } from './components/customer-management/customer-management';
import { AuthComponent } from './components/auth/auth';
import { authenticationGuard } from './guards/authentication-guard';
import { adminGuard } from './guards/admin-guard';

const routes: Routes = [
  { path: '', component: ProductList },
  { path: 'product/:id', component: ProductDetailComponent },
  { path: 'login', component: AuthComponent },
  { path: 'checkout', component: CheckoutComponent },
  { 
    path: 'dashboard', 
    component: Dashboard,
    canActivate: [adminGuard]
  },
  {
    path: 'orders',
    component: OrderManagement,
    canActivate: [adminGuard]
  },
  {
    path: 'customers',
    component: CustomerManagementComponent,
    canActivate: [adminGuard]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }