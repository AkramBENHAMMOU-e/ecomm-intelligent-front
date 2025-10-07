import { Component, OnInit } from '@angular/core';
import { Product } from '../../models/product.model';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { Cart, CartItem } from '../../models/cart.model';
import { OrderService } from '../../services/order.service';
import { RecommendationService } from '../../services/recommendation.service';
import { Order } from '../../models/order.model';

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

  // Cart state
  private cartId: number | null = null;
  adding: Record<number, boolean> = {};
  quantities: Record<number, number> = {};

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

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private orderService: OrderService,
    private recommendationService: RecommendationService
  ) {}

  ngOnInit(): void {
    this.fetchProducts();
    this.restoreCartId();
  }

  private fetchProducts(): void {
    this.loading = true;
    this.error = null;
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = data ?? [];
        // Initialize default quantities for all products
        this.products.forEach(product => {
          if (!this.quantities[product.id]) {
            this.quantities[product.id] = 1;
          }
        });
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
      },
      error: (err) => {
        console.error('Failed to remove item from cart', err);
        alert('Impossible de supprimer l\'article du panier.');
      }
    });
  }

  addToCart(product: Product): void {
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
            // Open sidebar and refresh cart view
            this.openCartSidebar();
          }
          this.adding[product.id] = false;
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
          this.orderService.checkout(cid).subscribe({
            next: (ord) => {
              this.lastOrder = ord;
              this.placing = false;
              localStorage.removeItem('cartId');
              this.cartId = null;
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
}
