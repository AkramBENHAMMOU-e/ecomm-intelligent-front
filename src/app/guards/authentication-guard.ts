import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Auth } from '../services/auth.service';

export const authenticationGuard: CanActivateFn = (route, state) => {
  const authService = inject(Auth);
  const router = inject(Router);
  
  // Check if user is authenticated
  if (authService.getAccessToken()) {
    // User is authenticated, allow access
    return true;
  }
  
  // User is not authenticated, redirect to login page
  return router.parseUrl('/login');
};