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
  showNavbar = true;
  
  // Cart state
  cartSidebarOpen = false;
  cart: Cart | null = null;
  private cartId: number | null = null;

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
        this.showNavbar = !event.url.includes('/login');
      });
  }

  ngOnInit(): void {
    this.restoreCartId();
    if (this.cartId) {
      this.loadCart();
    }
    
    // Rafraîchir le panier toutes les 5 secondes si ouvert
    setInterval(() => {
      if (this.cartId) {
        this.loadCart();
      }
    }, 5000);
  }

  private restoreCartId(): void {
    const saved = localStorage.getItem('cartId');
    if (saved) {
      const parsed = Number(saved);
      if (!Number.isNaN(parsed)) {
        this.cartId = parsed;
      }
    }
  }

  private loadCart(): void {
    if (!this.cartId) return;
    this.cartService.getCartById(this.cartId).subscribe({
      next: (c) => {
        this.cart = c;
      },
      error: (err) => {
        console.error('Failed to load cart', err);
      }
    });
  }

  // Cart sidebar methods
  openCartSidebar(): void {
    this.cartSidebarOpen = true;
    if (this.cartId) {
      this.loadCart();
    }
  }

  closeCartSidebar(): void {
    this.cartSidebarOpen = false;
  }

  updateCartItemQuantity(item: CartItem, newQuantity: number): void {
    if (!this.cartId || newQuantity < 1) return;

    if (newQuantity === 0) {
      this.removeItemFromCart(item);
      return;
    }

    const itemId = item.id;
    if (itemId === undefined) return;

    this.cartService.updateItemQuantity(this.cartId, itemId, newQuantity).subscribe({
      next: (updatedCart) => {
        this.cart = updatedCart;
      },
      error: (err) => {
        console.error('Failed to update item quantity', err);
      }
    });
  }

  removeItemFromCart(item: CartItem): void {
    if (!this.cartId || item.id === undefined) return;

    this.cartService.removeItemFromCart(this.cartId, item.id).subscribe({
      next: (updatedCart) => {
        this.cart = updatedCart;
      },
      error: (err) => {
        console.error('Failed to remove item from cart', err);
      }
    });
  }

  get cartTotal(): number {
    if (!this.cart?.items) return 0;
    return this.cart.items.reduce((sum, it) => sum + (it.product?.price || 0) * (it.quantity || 0), 0);
  }

  get cartItemsCount(): number {
    // Nombre d'articles distincts (items) dans le panier, pas la quantité totale
    if (!this.cart?.items) return 0;
    return this.cart.items.length;
  }

  // Method to handle admin logout
  logout(): void {
    this.authService.logout();
  }

  // Method to check if current user is admin
  isAdmin(): boolean {
    return this.authService.isAdmin();
  }
}