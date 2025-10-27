import { Component, OnInit } from '@angular/core';
import { Product } from '../../models/product.model';
import { ProductFilters, FilterOption } from '../../models/filter.model';
import { Page, PaginationParams } from '../../models/pagination.model';
import { ProductService } from '../../services/product.service';
import { ReviewService } from '../../services/review.service';
import { CartService } from '../../services/cart.service';
import { Cart, CartItem } from '../../models/cart.model';
import { OrderService } from '../../services/order.service';
import { RecommendationService } from '../../services/recommendation.service';
import { Order, CheckoutRequest } from '../../models/order.model';
import { CartNotificationService } from '../../services/cart-notification.service';
import { ProductReviewStats } from '../../models/review.model';

@Component({
  selector: 'app-product-list',
  standalone: false,
  templateUrl: './product-list.html',
  styleUrl: './product-list.css'
})
export class ProductList implements OnInit {
  public readonly Math = Math;

  products: Product[] = [];
  loading = false;
  error: string | null = null;
  searchTerm: string = '';

  // Pagination
  currentPage: Page<Product> | null = null;
  currentPageNumber = 0;
  pageSize = 12;
  totalPages = 0;
  totalElements = 0;

  // Filtres
  filters: ProductFilters = {};
  filterSidebarOpen = false;
  searchLoading = false;
  
  // Options de filtres
  originOptions: FilterOption[] = [];
  roastLevelOptions: FilterOption[] = [];
  brandOptions: FilterOption[] = [];
  regionOptions: FilterOption[] = [];
  processOptions: FilterOption[] = [];
  
  // Prix
  minPrice = 0;
  maxPrice = 1000;
  
  // Ratings et avis
  productRatings: Map<number, ProductReviewStats> = new Map();
  priceRange = { min: 0, max: 1000 };

  // Cart state
  private cartId: number | null = null;
  adding: Record<number, boolean> = {};
  quantities: Record<number, number> = {};
  cartItemsCount: number = 0;

  // Cart sidebar state
  cartSidebarOpen = false;
  cart: Cart | null = null;

  // Quick order panel state
  panelOpen = false;
  selected: Product | null = null;
  qty = 1;
  placing = false;
  lastOrder: Order | null = null;
  panelError: string | null = null;

  // Recommendations state
  recLoading = false;
  recError: string | null = null;
  recommendations: Product[] = [];

  // Popular products state
  popularProducts: Product[] = [];
  popularLoading = false;

  constructor(
    private productService: ProductService,
    private reviewService: ReviewService,
    private cartService: CartService,
    private orderService: OrderService,
    private recommendationService: RecommendationService,
    private cartNotificationService: CartNotificationService
  ) {}

  ngOnInit(): void {
    this.loadProductsPaginated();
    this.restoreCartId();
    this.loadPopularProducts();
    this.loadFilterOptions();
    this.loadProductRatings();
    
    // Subscribe to search term changes from navbar
    this.productService.getSearchTerm().subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      if (searchTerm.trim()) {
        this.filters.name = searchTerm;
        this.currentPageNumber = 0;
        this.loadProductsWithFiltersPaginated();
      } else {
        this.filters.name = undefined;
        this.currentPageNumber = 0;
        this.loadProductsPaginated();
      }
    });
  }

  private loadPopularProducts(): void {
    this.popularLoading = true;
    this.recommendationService.getPopular(5).subscribe({
      next: (products) => {
        // Ajouter des données fictives pour démonstration du carrousel
        this.popularProducts = products.map((product, index) => ({
          ...product,
          discount: index < 3 ? [15, 25, 10][index] : 0, // 15%, 25%, 10% de remise pour les 3 premiers
          rating: Math.round((4 + Math.random()) * 10) / 10 // Rating entre 4.0 et 5.0
        }));

        console.log('✅ Produits populaires reçus du backend:', this.popularProducts);
        console.log('📊 IDs des produits populaires:', this.popularProducts.map(p => ({ id: p.id, name: p.name })));

        // Initialiser les quantités par défaut pour les produits populaires
        this.popularProducts.forEach(product => {
          if (!this.quantities[product.id]) {
            this.quantities[product.id] = 1;
          }
        });

        this.popularLoading = false;
      },
      error: (err) => {
        console.error('❌ Erreur lors du chargement des produits populaires', err);
        this.popularLoading = false;
      }
    });
  }

  private loadProductsWithCache(): void {
    // Vérifier d'abord si on a des produits en cache
    const cachedProducts = this.productService.getCachedProducts();
    if (cachedProducts.length > 0) {
      console.log('📦 Utilisation du cache des produits');
      this.products = cachedProducts;
      this.initializeQuantities();
      return;
    }
    
    // Sinon, charger depuis le serveur
    this.fetchProducts();
  }

  private initializeQuantities(): void {
    // Initialize default quantities for all products
    this.products.forEach(product => {
      if (!this.quantities[product.id]) {
        this.quantities[product.id] = 1;
      }
    });
  }
  
  // Méthode publique pour forcer le rechargement
  refreshProducts(): void {
    console.log('🔄 Rechargement forcé des produits');
    this.productService.refreshProducts().subscribe({
      next: (data: Product[]) => {
        this.products = data ?? [];
        this.initializeQuantities();
        console.log('✅ Produits rechargés depuis le serveur');
      },
      error: (err: any) => {
        console.error('Erreur lors du rechargement:', err);
        this.error = 'Erreur lors du rechargement des produits';
      }
    });
  }

  private fetchProducts(): void {
    this.loading = true;
    this.error = null;
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = data ?? [];
        this.initializeQuantities();
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load products', err);
        this.error = 'Impossible de charger les produits';
        this.loading = false;
      }
    });
  }

  private restoreCartId(): void {
    const saved = localStorage.getItem('cartId');
    if (saved) {
      const parsed = Number(saved);
      if (!Number.isNaN(parsed)) {
        this.cartId = parsed;
        this.loadCart();
      }
    }
  }

  // Cart sidebar helpers
  openCartSidebar(): void {
    this.cartSidebarOpen = true;
    this.loadCart();
  }

  closeCartSidebar(): void {
    this.cartSidebarOpen = false;
  }

  private loadCart(): void {
    if (!this.cartId) return;
    this.cartService.getCartById(this.cartId).subscribe({
      next: (c) => this.cart = c,
      error: (err) => {
        console.error('Failed to load cart', err);
      }
    });
  }

  // Méthodes de pagination
  private loadProductsPaginated(): void {
    this.loading = true;
    this.error = null;
    
    const params: PaginationParams = {
      page: this.currentPageNumber,
      size: this.pageSize
    };

    this.productService.getProductsPaginated(params).subscribe({
      next: (page) => {
        this.currentPage = page;
        this.products = page.content;
        this.totalPages = page.totalPages;
        this.totalElements = page.totalElements;
        this.loading = false;
        console.log('✅ Produits paginés chargés:', page);
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des produits paginés:', error);
        this.error = 'Erreur lors du chargement des produits';
        this.loading = false;
      }
    });
  }

  private loadProductsWithFiltersPaginated(): void {
    this.searchLoading = true;
    this.error = null;
    
    const params: PaginationParams = {
      page: this.currentPageNumber,
      size: this.pageSize
    };

    // Convertir les filtres pour le service
    const searchFilters: {
      name?: string;
      origin?: string;
      roastLevel?: string;
      brand?: string;
      region?: string;
      process?: string;
      minPrice?: number;
      maxPrice?: number;
    } = {
      name: this.filters.name,
      minPrice: this.minPrice,
      maxPrice: this.maxPrice
    };

    // Ajouter les filtres multiples
    if (this.filters.origin && Array.isArray(this.filters.origin) && this.filters.origin.length > 0) {
      searchFilters.origin = this.filters.origin.join(',');
    }
    if (this.filters.roastLevel && Array.isArray(this.filters.roastLevel) && this.filters.roastLevel.length > 0) {
      searchFilters.roastLevel = this.filters.roastLevel.join(',');
    }
    if (this.filters.brand && Array.isArray(this.filters.brand) && this.filters.brand.length > 0) {
      searchFilters.brand = this.filters.brand.join(',');
    }
    if (this.filters.region && Array.isArray(this.filters.region) && this.filters.region.length > 0) {
      searchFilters.region = this.filters.region.join(',');
    }
    if (this.filters.process && Array.isArray(this.filters.process) && this.filters.process.length > 0) {
      searchFilters.process = this.filters.process.join(',');
    }

    this.productService.searchProductsPaginated(searchFilters, params).subscribe({
      next: (page) => {
        this.currentPage = page;
        this.products = page.content;
        this.totalPages = page.totalPages;
        this.totalElements = page.totalElements;
        this.searchLoading = false;
        console.log('✅ Produits filtrés paginés chargés:', page);
      },
      error: (error) => {
        console.error('❌ Erreur lors de la recherche paginée:', error);
        this.error = 'Erreur lors de la recherche';
        this.searchLoading = false;
      }
    });
  }

  // Méthodes de navigation de pagination
  goToPage(pageNumber: number): void {
    if (pageNumber >= 0 && pageNumber < this.totalPages) {
      this.currentPageNumber = pageNumber;
      if (this.hasActiveFilters()) {
        this.loadProductsWithFiltersPaginated();
      } else {
        this.loadProductsPaginated();
      }
    }
  }

  goToPreviousPage(): void {
    if (this.currentPageNumber > 0) {
      this.goToPage(this.currentPageNumber - 1);
    }
  }

  goToNextPage(): void {
    if (this.currentPageNumber < this.totalPages - 1) {
      this.goToPage(this.currentPageNumber + 1);
    }
  }

  // Méthode pour vérifier s'il y a des filtres actifs
  private hasActiveFilters(): boolean {
    return !!(
             (this.filters.origin && Array.isArray(this.filters.origin) && this.filters.origin.length > 0) ||
             (this.filters.roastLevel && Array.isArray(this.filters.roastLevel) && this.filters.roastLevel.length > 0) ||
             (this.filters.brand && Array.isArray(this.filters.brand) && this.filters.brand.length > 0) ||
             (this.filters.region && Array.isArray(this.filters.region) && this.filters.region.length > 0) ||
             (this.filters.process && Array.isArray(this.filters.process) && this.filters.process.length > 0) ||
             this.filters.minPrice || this.filters.maxPrice);
  }

  // Méthode pour générer les numéros de page à afficher
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    if (this.totalPages <= maxVisiblePages) {
      // Si le nombre total de pages est petit, afficher toutes les pages
      for (let i = 0; i < this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Logique pour afficher les pages avec ellipses
      const start = Math.max(0, this.currentPageNumber - 2);
      const end = Math.min(this.totalPages - 1, this.currentPageNumber + 2);
      
      if (start > 0) {
        pages.push(0);
        if (start > 1) {
          pages.push(-1); // Ellipsis
        }
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (end < this.totalPages - 1) {
        if (end < this.totalPages - 2) {
          pages.push(-1); // Ellipsis
        }
        pages.push(this.totalPages - 1);
      }
    }
    
    return pages;
  }

  // Méthodes pour la gestion des filtres actifs
  getActiveFiltersCount(): number {
    let count = 0;
    
    // Ne plus compter le filtre name car il est géré par la navbar
    
    if (this.filters.origin && Array.isArray(this.filters.origin)) {
      count += this.filters.origin.length;
    }
    if (this.filters.roastLevel && Array.isArray(this.filters.roastLevel)) {
      count += this.filters.roastLevel.length;
    }
    if (this.filters.brand && Array.isArray(this.filters.brand)) {
      count += this.filters.brand.length;
    }
    if (this.filters.region && Array.isArray(this.filters.region)) {
      count += this.filters.region.length;
    }
    if (this.filters.process && Array.isArray(this.filters.process)) {
      count += this.filters.process.length;
    }
    
    if (this.hasPriceFilter()) count++;
    
    return count;
  }

  getActiveFilterValues(filterType: keyof ProductFilters): string[] {
    const filter = this.filters[filterType];
    if (Array.isArray(filter)) {
      return filter;
    }
    return [];
  }

  hasPriceFilter(): boolean {
    return this.minPrice !== this.priceRange.min || this.maxPrice !== this.priceRange.max;
  }

  getPriceFilterText(): string {
    if (this.minPrice === this.priceRange.min && this.maxPrice === this.priceRange.max) {
      return '';
    }
    
    if (this.minPrice === this.priceRange.min) {
      return `jusqu'à ${this.maxPrice} DH`;
    }
    
    if (this.maxPrice === this.priceRange.max) {
      return `à partir de ${this.minPrice} DH`;
    }
    
    return `${this.minPrice} - ${this.maxPrice} DH`;
  }

  // Méthodes pour supprimer des filtres individuels
  removeFilterValue(filterType: keyof ProductFilters, value: string): void {
    const filterArray = (this.filters as any)[filterType] as string[];
    if (filterArray && Array.isArray(filterArray)) {
      const index = filterArray.indexOf(value);
      if (index > -1) {
        filterArray.splice(index, 1);
        this.currentPageNumber = 0;
        this.loadProductsWithFiltersPaginated();
      }
    }
  }

  removePriceFilter(): void {
    this.minPrice = this.priceRange.min;
    this.maxPrice = this.priceRange.max;
    this.currentPageNumber = 0;
    this.loadProductsWithFiltersPaginated();
  }

  // Méthode pour vérifier si une valeur de filtre est sélectionnée
  isFilterValueSelected(filterType: keyof ProductFilters, value: string): boolean {
    const filter = this.filters[filterType];
    if (Array.isArray(filter)) {
      return filter.includes(value);
    }
    return false;
  }

  get cartTotal(): number {
    if (!this.cart?.items) return 0;
    return this.cart.items.reduce((sum, it) => sum + (it.product?.price || 0) * (it.quantity || 0), 0);
  }

  updateQuantity(productId: number, value: number | null): void {
    if (value === null || value === undefined) {
      this.quantities[productId] = 1;
      return;
    }
    // Ensure minimum quantity is 1 and maximum is 99
    const quantity = Math.max(1, Math.min(99, Math.floor(value)));
    this.quantities[productId] = quantity;
  }

  // Filtered products based on search term
  get filteredProducts(): Product[] {
    const term = (this.searchTerm || '').trim().toLowerCase();
    if (!term) return this.products;
    return this.products.filter(p => {
      const name = (p.name || '').toLowerCase();
      const desc = (p.description || '').toLowerCase();
      const cat = (p.category || '').toLowerCase();
      return name.includes(term) || desc.includes(term) || cat.includes(term);
    });
  }


  updateCartItemQuantity(item: CartItem, newQuantity: number): void {
    if (!this.cartId || newQuantity < 1) return;

    // If quantity is 0, remove the item
    if (newQuantity === 0) {
      this.removeItemFromCart(item);
      return;
    }

    const itemId = item.id;
    if (itemId === undefined) return;

    this.cartService.updateItemQuantity(this.cartId, itemId, newQuantity).subscribe({
      next: (updatedCart) => {
        this.cart = updatedCart;
        // Update local storage if cart ID changed
        if (updatedCart?.id && updatedCart.id !== this.cartId) {
          this.cartId = updatedCart.id;
          localStorage.setItem('cartId', String(this.cartId));
        }
        
        // Forcer le rechargement des produits depuis le serveur
        this.productService.refreshProducts().subscribe({
          next: (products: Product[]) => {
            this.products = products;
            this.initializeQuantities();
            console.log('✅ Quantité mise à jour, produits rechargés depuis le serveur');
          },
          error: (err: any) => {
            console.error('Erreur lors du rechargement des produits:', err);
          }
        });
      },
      error: (err) => {
        console.error('Failed to update item quantity', err);
        alert('Impossible de mettre à jour la quantité.');
      }
    });
  }

  // New method to remove item from cart
  removeItemFromCart(item: CartItem): void {
    if (!this.cartId || item.id === undefined) return;

    this.cartService.removeItemFromCart(this.cartId, item.id).subscribe({
      next: (updatedCart) => {
        this.cart = updatedCart;
        // Update local storage if cart ID changed
        if (updatedCart?.id && updatedCart.id !== this.cartId) {
          this.cartId = updatedCart.id;
          localStorage.setItem('cartId', String(this.cartId));
        }
        
        // Forcer le rechargement des produits depuis le serveur
        this.productService.refreshProducts().subscribe({
          next: (products: Product[]) => {
            this.products = products;
            this.initializeQuantities();
            console.log('✅ Article supprimé du panier, produits rechargés depuis le serveur');
          },
          error: (err: any) => {
            console.error('Erreur lors du rechargement des produits:', err);
          }
        });
      },
      error: (err) => {
        console.error('Failed to remove item from cart', err);
        alert('Impossible de supprimer l\'article du panier.');
      }
    });
  }

  addToCart(product: Product): void {
    console.log('🛒 Tentative d\'ajout au panier pour le produit:', product.name, 'ID:', product.id);
    if (this.adding[product.id]) return;
    this.adding[product.id] = true;

    const quantity = Math.max(1, Math.floor(this.quantities[product.id] || 1));

    const doAdd = (cid: number) => {
      this.cartService.addItemToCart(cid, { productId: product.id, quantity }).subscribe({
        next: (updatedCart) => {
          if (updatedCart?.id) {
            if (updatedCart.id !== this.cartId) {
              this.cartId = updatedCart.id;
              localStorage.setItem('cartId', String(updatedCart.id));
            }
            // Mettre à jour le compteur du panier localement
            this.updateCartItemsCount();
          }
          this.adding[product.id] = false;
          
          // Afficher une notification de succès
          this.showSuccessNotification(`${product.name} ajouté au panier !`);
          
          // Notifier la navbar que le panier a été mis à jour avec le panier complet
          this.cartNotificationService.notifyCartUpdated(updatedCart, 'add');
          
          console.log('✅ Produit ajouté au panier avec succès');
        },
        error: (err) => {
          console.error('Failed to add item to cart', err);
          this.adding[product.id] = false;
          alert('Impossible d\'ajouter au panier.');
        }
      });
    };

    if (this.cartId) {
      doAdd(this.cartId);
    } else {
      // Create a new cart, then add
      const newCart: Cart = { items: [] };
      this.cartService.createCart(newCart).subscribe({
        next: (created) => {
          if (!created?.id) {
            throw new Error('Cart creation failed: missing id');
          }
          this.cartId = created.id as number;
          localStorage.setItem('cartId', String(this.cartId));
          doAdd(this.cartId);
        },
        error: (err) => {
          console.error('Failed to create cart', err);
          this.adding[product.id] = false;
          alert('Création du panier échouée.');
        }
      });
    }
  }


  openPanel(p: Product): void {
    this.selected = p;
    this.qty = 1;
    this.panelError = null;
    this.lastOrder = null;
    this.panelOpen = true;
  }

  closePanel(): void {
    this.panelOpen = false;
    this.selected = null;
    this.panelError = null;
    this.lastOrder = null;
  }

  addSelectedToCart(): void {
    if (!this.selected) return;
    const product = this.selected;
    const quantity = Math.max(1, Math.floor(this.qty || 1));

    const doAdd = (cid: number) => {
      this.cartService.addItemToCart(cid, { productId: product.id, quantity }).subscribe({
        next: (updatedCart) => {
          if (updatedCart?.id && updatedCart.id !== this.cartId) {
            this.cartId = updatedCart.id;
            localStorage.setItem('cartId', String(this.cartId));
          }
          alert('Article ajouté au panier.');
          
          // Notifier la navbar que le panier a été mis à jour avec le panier complet
          this.cartNotificationService.notifyCartUpdated(updatedCart, 'add');
        },
        error: (err) => {
          console.error('Failed to add item to cart', err);
          alert('Impossible d\'ajouter au panier.');
        }
      });
    };

    if (this.cartId) {
      doAdd(this.cartId);
    } else {
      const newCart: Cart = { items: [] };
      this.cartService.createCart(newCart).subscribe({
        next: (created) => {
          if (!created?.id) throw new Error('Cart creation failed: missing id');
          this.cartId = created.id as number;
          localStorage.setItem('cartId', String(this.cartId));
          doAdd(this.cartId);
        },
        error: (err) => {
          console.error('Failed to create cart', err);
          alert('Création du panier échouée.');
        }
      });
    }
  }

  buyNow(): void {
    if (!this.selected) return;
    this.panelError = null;
    this.placing = true;
    const product = this.selected;
    const quantity = Math.max(1, Math.floor(this.qty || 1));

    const proceedCheckout = (cid: number) => {
      // add selected item then checkout
      this.cartService.addItemToCart(cid, { productId: product.id, quantity }).subscribe({
        next: () => {
          // Mettre à jour le compteur du panier localement
          this.updateCartItemsCount();
          
          const checkoutRequest: CheckoutRequest = {
            cartId: cid,
            firstName: 'Client',
            lastName: 'Express',
            email: '',
            phone: '',
            address: ''
          };
          this.orderService.checkout(checkoutRequest).subscribe({
            next: (ord) => {
              this.lastOrder = ord;
              this.placing = false;
              localStorage.removeItem('cartId');
              this.cartId = null;
              this.cartItemsCount = 0;
            },
            error: (err) => {
              console.error('Checkout failed', err);
              this.placing = false;
              if (err?.status === 400) this.panelError = 'Le panier est vide.';
              else if (err?.status === 404) this.panelError = 'Panier introuvable.';
              else this.panelError = 'Échec de la commande.';
            }
          });
        },
        error: (err) => {
          console.error('Failed to add item to cart before checkout', err);
          this.placing = false;
          this.panelError = 'Impossible d\'ajouter l\'article au panier.';
        }
      });
    };

    if (this.cartId) {
      proceedCheckout(this.cartId);
    } else {
      const newCart: Cart = { items: [] };
      this.cartService.createCart(newCart).subscribe({
        next: (created) => {
          if (!created?.id) {
            throw new Error('Cart creation failed: missing id');
          }
          this.cartId = created.id as number;
          localStorage.setItem('cartId', String(this.cartId));
          proceedCheckout(this.cartId);
        },
        error: (err) => {
          console.error('Failed to create cart', err);
          this.placing = false;
          this.panelError = 'Création du panier échouée.';
        }
      });
    }
  }

  updateCartItemsCount(): void {
    if (this.cartId) {
      this.cartService.getCartById(this.cartId).subscribe({
        next: (cart) => {
          this.cartItemsCount = cart.items?.reduce((total, item) => total + item.quantity, 0) || 0;
        },
        error: (err) => {
          console.error('Erreur lors de la mise à jour du compteur du panier:', err);
        }
      });
    }
  }

  showSuccessNotification(message: string): void {
    // Créer une notification temporaire
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      font-weight: 500;
      animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    // Supprimer la notification après 3 secondes
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-in';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  // Méthodes pour les filtres
  private loadFilterOptions(): void {
    this.productService.getProducts().subscribe(products => {
      this.extractFilterOptions(products);
      this.updatePriceRange(products);
    });
  }

  private extractFilterOptions(products: Product[]): void {
    const origins = new Set<string>();
    const roastLevels = new Set<string>();
    const brands = new Set<string>();
    const regions = new Set<string>();
    const processes = new Set<string>();

    products.forEach(product => {
      if (product.origin) origins.add(product.origin);
      if (product.roastLevel) roastLevels.add(product.roastLevel);
      if (product.brand) brands.add(product.brand);
      if (product.region) regions.add(product.region);
      if (product.process) processes.add(product.process);
    });

    this.originOptions = Array.from(origins).map(origin => ({ value: origin, label: origin }));
    this.roastLevelOptions = Array.from(roastLevels).map(level => ({ value: level, label: level }));
    this.brandOptions = Array.from(brands).map(brand => ({ value: brand, label: brand }));
    this.regionOptions = Array.from(regions).map(region => ({ value: region, label: region }));
    this.processOptions = Array.from(processes).map(process => ({ value: process, label: process }));
  }

  private updatePriceRange(products: Product[]): void {
    const prices = products.map(p => p.price).filter(price => price != null);
    if (prices.length > 0) {
      this.priceRange.min = Math.min(...prices);
      this.priceRange.max = Math.max(...prices);
      this.minPrice = this.priceRange.min;
      this.maxPrice = this.priceRange.max;
    }
  }

  openFilterSidebar(): void {
    this.filterSidebarOpen = true;
  }

  closeFilterSidebar(): void {
    this.filterSidebarOpen = false;
  }

  applyFilters(): void {
    this.currentPageNumber = 0; // Reset to first page when applying filters
    this.loadProductsWithFiltersPaginated();
    this.closeFilterSidebar();
  }

  clearFilters(): void {
    this.filters = {};
    this.minPrice = this.priceRange.min;
    this.maxPrice = this.priceRange.max;
    this.currentPageNumber = 0; // Reset to first page when clearing filters
    this.loadProductsPaginated();
    this.closeFilterSidebar();
  }

  onFilterChange(): void {
    // Appliquer automatiquement les filtres après un délai
    setTimeout(() => {
      this.currentPageNumber = 0; // Reset to first page when filters change
      this.loadProductsWithFiltersPaginated();
    }, 500);
  }

  onPriceRangeChange(): void {
    this.onFilterChange();
  }

  // Méthodes pour gérer les cases à cocher
  onCheckboxChange(filterType: keyof ProductFilters, value: string, checked: boolean): void {
    if (!this.filters[filterType]) {
      (this.filters as any)[filterType] = [];
    }
    
    const filterArray = (this.filters as any)[filterType] as string[];
    
    if (checked) {
      if (!filterArray.includes(value)) {
        filterArray.push(value);
      }
    } else {
      const index = filterArray.indexOf(value);
      if (index > -1) {
        filterArray.splice(index, 1);
      }
    }
    
    this.onFilterChange();
  }

  // Méthodes pour gérer les ratings
  getProductRating(product: Product): number | null {
    const stats = this.productRatings.get(product.id);
    return stats ? stats.averageRating : null;
  }

  loadProductRatings() {
    this.products.forEach(product => {
      this.reviewService.getProductReviewStats(product.id).subscribe({
        next: (stats: ProductReviewStats) => {
          this.productRatings.set(product.id, stats);
        },
        error: (error: any) => {
          console.error(`Erreur lors du chargement des statistiques pour le produit ${product.id}:`, error);
        }
      });
    });
  }
}
