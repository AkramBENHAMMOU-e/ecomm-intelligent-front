import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { ProductList } from './components/product-list/product-list';
import { ProductDetailComponent } from './components/product-detail/product-detail';
import { CheckoutComponent } from './components/checkout/checkout';
import { Dashboard } from './components/dashboard/dashboard';
import { AddProduct } from './components/add-product/add-product';
import { OrderManagement } from './components/dashboard/order-management';
import { AuthComponent } from './components/auth/auth';
import { AppHttpInterceptor } from './interceptors/app-http-interceptor';
import { authenticationGuard } from './guards/authentication-guard';
import { adminGuard } from './guards/admin-guard';

@NgModule({
  declarations: [
    App,
    ProductList,
    ProductDetailComponent,
    CheckoutComponent,
    Dashboard,
    AddProduct,
    OrderManagement,
    AuthComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    AppRoutingModule
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    {
      provide: 'authenticationGuard',
      useValue: authenticationGuard
    },
    {
      provide: 'adminGuard',
      useValue: adminGuard
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AppHttpInterceptor,
      multi: true
    }
  ],
  bootstrap: [App]
})
export class AppModule { }