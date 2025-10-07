import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Auth } from '../services/auth.service';

@Injectable()
export class AppHttpInterceptor implements HttpInterceptor {
  constructor(private authService: Auth) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Get the auth token from the service
    const token = this.authService.getAccessToken();

    // Debug logging
    console.log('Interceptor - Token:', token);
    console.log('Interceptor - Request URL:', req.url);

    // Don't add auth header to login requests
    if (req.url.includes('/auth/login')) {
      console.log('Interceptor - Login request, skipping auth header');
      return next.handle(req);
    }

    // Don't add auth header to truly public API endpoints only
    // - GET /api/products/** is public
    // - Cart and checkout endpoints are public for customers
    const isPublicGetProducts = req.method === 'GET' && req.url.includes('/api/products');
    const isPublicCartOrCheckout = req.url.includes('/api/carts') || req.url.includes('/api/orders/checkout');

    if (isPublicGetProducts || isPublicCartOrCheckout) {
      console.log('Interceptor - Public endpoint, skipping auth header');
      return next.handle(req);
    }

    // If we have a token and the request is to our API, clone the request and add the Authorization header
    if (token && req.url.includes('localhost:8080')) {
      const authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
      console.log('Interceptor - Modified request with auth header');
      return next.handle(authReq);
    }

    // If no token or not our API, just continue with the original request
    console.log('Interceptor - No token or not API request, continuing with original');
    return next.handle(req);
  }
}
