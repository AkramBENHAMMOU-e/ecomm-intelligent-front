import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProductList } from './components/product-list/product-list';
import { CheckoutComponent } from './components/checkout/checkout';
import { Dashboard } from './components/dashboard/dashboard';
import { AddProduct } from './components/add-product/add-product';
import { OrderManagement } from './components/dashboard/order-management';
import { AuthComponent } from './components/auth/auth';
import { authenticationGuard } from './guards/authentication-guard';
import { adminGuard } from './guards/admin-guard';

const routes: Routes = [
  { path: '', component: ProductList },
  { path: 'login', component: AuthComponent },
  { path: 'checkout', component: CheckoutComponent },
  { 
    path: 'dashboard', 
    component: Dashboard,
    canActivate: [adminGuard],
    children: [
      { path: 'orders', component: OrderManagement },
      { path: 'add-product', component: AddProduct },
      { path: 'add-product/:id', component: AddProduct }
    ]
  },
  // Redirect old paths to new nested structure
  { path: 'add-product', redirectTo: 'dashboard/add-product' },
  { path: 'add-product/:id', redirectTo: 'dashboard/add-product/:id' },
  { path: 'orders', redirectTo: 'dashboard/orders' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }