import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Auth } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(Auth);
  const router = inject(Router);
  
  // Check if user is authenticated
  if (!authService.getAccessToken()) {
    // User is not authenticated, redirect to login page
    return router.parseUrl('/login');
  }
  
  // Check if user is admin
  if (authService.isAdmin()) {
    // User is authenticated and is admin, allow access
    return true;
  }
  
  // User is authenticated but not admin, redirect to home page
  return router.parseUrl('/');
};