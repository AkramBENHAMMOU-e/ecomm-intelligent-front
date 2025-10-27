import { Component, signal, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Auth } from './services/auth.service';
import { CartService } from './services/cart.service';
import { Cart, CartItem } from './models/cart.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('frontend-angular-ecom');

  constructor(
    private router: Router, 
    private authService: Auth,
    private cartService: CartService
  ) {
    // Subscribe to router events to determine when to show/hide navbar
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        // Hide navbar on login page
        // This logic is now handled by the navbar component
      });
  }

  ngOnInit(): void {
    // Navbar logic moved to navbar component
  }
}