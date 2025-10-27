import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
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
import { CustomerManagementComponent } from './components/customer-management/customer-management';
import { AuthComponent } from './components/auth/auth';
import { AppHttpInterceptor } from './interceptors/app-http-interceptor';
import { authenticationGuard } from './guards/authentication-guard';
import { adminGuard } from './guards/admin-guard';
import { ChatAssistant } from './components/chat-assistant/chat-assistant';
import { PopularCarousel } from './components/popular-carousel/popular-carousel';
import { Navbar } from './components/navbar/navbar';
import { ImageFallbackDirective } from './directives/image-fallback.directive';
import { ProductReviewsComponent } from './components/product-reviews/product-reviews';

@NgModule({
  declarations: [
    App,
    ProductList,
    ProductDetailComponent,
    CheckoutComponent,
    Dashboard,
    AddProduct,
    OrderManagement,
    CustomerManagementComponent,
    AuthComponent,
    ChatAssistant,
    PopularCarousel,
    Navbar,
    ImageFallbackDirective,
    ProductReviewsComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
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
