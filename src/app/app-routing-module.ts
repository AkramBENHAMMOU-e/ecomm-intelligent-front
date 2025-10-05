import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProductList } from './components/product-list/product-list';
import { CheckoutComponent } from './components/checkout/checkout';
import { Dashboard } from './components/dashboard/dashboard';
import { AddProduct } from './components/add-product/add-product';
import { OrderManagement } from './components/dashboard/order-management';

const routes: Routes = [
  { path: '', component: ProductList },
  { path: 'checkout', component: CheckoutComponent },
  { path: 'dashboard', component: Dashboard },
  { path: 'add-product', component: AddProduct },
  { path: 'add-product/:id', component: AddProduct },
  { path: 'orders', component: OrderManagement }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }