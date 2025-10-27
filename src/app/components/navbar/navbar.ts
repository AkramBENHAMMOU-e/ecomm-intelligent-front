import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { Auth } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { Cart, CartItem } from '../../models/cart.model';
import { ProductService } from '../../services/product.service';
import { CartNotificationService } from '../../services/cart-notification.service';
import { CartCacheService } from '../../services/cart-cache.service';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Navbar implements OnInit, OnDestroy {
  showNavbar = true;
  
  // Search state
  searchTerm: string = '';
  
  // Cart state
  cartSidebarOpen = false;
  cart: Cart | null = null;
  private cartId: number | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router, 
    private authService: Auth,
    private cartService: CartService,
    private productService: ProductService,
    private cartNotificationService: CartNotificationService,
    private cartCacheService: CartCacheService,
    private cdr: ChangeDetectorRef
  ) {
    // Subscribe to router events to determine when to show/hide navbar
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        // Hide navbar on login page
        this.showNavbar = !event.url.includes('/login');
        this.cdr.markForCheck(); // Déclencher la détection de changements
      });
  }

  ngOnInit(): void {
    this.restoreCartId();
    if (this.cartId) {
      this.loadCart();
    }
    
    // Écouter les notifications de mise à jour du panier
    this.cartNotificationService.cartUpdated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ cart, action }) => {
        // Utiliser le panier depuis le cache au lieu de faire une nouvelle requête
        this.cart = cart;
        this.cdr.markForCheck(); // Déclencher la détection de changements
        console.log(`📦 Panier mis à jour via cache (action: ${action})`);
      });
    
    // Écouter les changements du cache du panier
    this.cartCacheService.cart$
      .pipe(takeUntil(this.destroy$))
      .subscribe(cart => {
        this.cart = cart;
        this.cdr.markForCheck(); // Déclencher la détection de changements
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
        // Mettre à jour le cache
        this.cartCacheService.updateCart(c);
        this.cdr.markForCheck(); // Déclencher la détection de changements
        console.log('📦 Panier chargé depuis le serveur et mis en cache');
      },
      error: (err) => {
        console.error('Failed to load cart', err);
      }
    });
  }

  // Cart sidebar methods
  openCartSidebar(): void {
    console.log('🛒 openCartSidebar() appelée - cartSidebarOpen avant:', this.cartSidebarOpen);
    this.cartSidebarOpen = true;
    console.log('🛒 cartSidebarOpen après:', this.cartSidebarOpen);
    this.cdr.markForCheck(); // Déclencher la détection de changements pour l'ouverture
    
    // Utiliser le cache si disponible et récent, sinon charger depuis le serveur
    if (this.cartCacheService.isCacheValid() && this.cartCacheService.getCurrentCart()) {
      this.cart = this.cartCacheService.getCurrentCart();
      this.cdr.markForCheck(); // Déclencher la détection de changements
      console.log('📦 Panier chargé depuis le cache');
    } else if (!this.cart) {
      this.loadCart();
    }
  }

  closeCartSidebar(): void {
    this.cartSidebarOpen = false;
    this.cdr.markForCheck(); // Déclencher la détection de changements pour la fermeture
  }

  // Méthode pour forcer le rechargement du panier (utile après ajout de produit)
  refreshCart(): void {
    if (this.cartId) {
      this.loadCart();
    }
  }

  updateCartItemQuantity(item: CartItem, newQuantity: number): void {
    if (!this.cartId || item.id === undefined) return;

    this.cartService.updateItemQuantity(this.cartId, item.id, newQuantity).subscribe({
      next: (updatedCart) => {
        this.cart = updatedCart;
        // Mettre à jour le cache
        this.cartCacheService.updateCart(updatedCart);
        this.cdr.markForCheck(); // Déclencher la détection de changements
        console.log('📦 Quantité mise à jour et cache actualisé');
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
        // Mettre à jour le cache
        this.cartCacheService.updateCart(updatedCart);
        this.cdr.markForCheck(); // Déclencher la détection de changements
        console.log('📦 Article supprimé et cache actualisé');
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
    this.cdr.markForCheck(); // Déclencher la détection de changements
  }

  // Method to check if current user is admin
  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  // Search methods
  onSearchChange(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.cdr.markForCheck(); // Déclencher la détection de changements
    // Emit search term to product list component
    this.productService.setSearchTerm(searchTerm);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.cdr.markForCheck(); // Déclencher la détection de changements
    this.productService.setSearchTerm('');
  }
}
