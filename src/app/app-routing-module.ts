import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProductList } from './components/product-list/product-list';
import { CheckoutComponent } from './components/checkout/checkout';

const routes: Routes = [
  { path: '', component: ProductList },
  { path: 'checkout', component: CheckoutComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
