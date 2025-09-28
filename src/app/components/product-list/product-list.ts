import { Component, OnInit } from '@angular/core';
import { Product } from '../../models/product.model';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { Cart } from '../../models/cart.model';
import { OrderService } from '../../services/order.service';
import { Order } from '../../models/order.model';

@Component({
  selector: 'app-product-list',
  standalone: false,
  templateUrl: './product-list.html',
  styleUrl: './product-list.css'
})
export class ProductList implements OnInit {
  // Expose Math to template (fix TS2339 in template)
  public readonly Math = Math;

  products: Product[] = [];
  loading = false;
  error: string | null = null;

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

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private orderService: OrderService
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

  addToCart(product: Product): void {
    if (this.adding[product.id]) return; // prevent double-clicks
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

  // Quick order panel handlers
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
            localStorage.setItem('cartId', String(updatedCart.id));
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
