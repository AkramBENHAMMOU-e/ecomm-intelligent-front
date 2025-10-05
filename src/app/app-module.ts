import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { ProductList } from './components/product-list/product-list';
import { CheckoutComponent } from './components/checkout/checkout';
import { Dashboard } from './components/dashboard/dashboard';
import { AddProduct } from './components/add-product/add-product';

@NgModule({
  declarations: [
    App,
    ProductList,
    CheckoutComponent,
    Dashboard,
    AddProduct
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    AppRoutingModule
  ],
  providers: [
    provideBrowserGlobalErrorListeners()
  ],
  bootstrap: [App]
})
export class AppModule { }
