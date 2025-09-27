import { Component, OnInit } from '@angular/core';
import { Product } from '../../models/product.model';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { Cart } from '../../models/cart.model';

@Component({
  selector: 'app-product-list',
  standalone: false,
  templateUrl: './product-list.html',
  styleUrl: './product-list.css'
})
export class ProductList implements OnInit {
  products: Product[] = [];
  loading = false;
  error: string | null = null;

  // Cart state
  private cartId: number | null = null;
  adding: Record<number, boolean> = {};

  constructor(
    private productService: ProductService,
    private cartService: CartService
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
      }
    }
  }

  addToCart(product: Product): void {
    if (this.adding[product.id]) return; // prevent double-clicks
    this.adding[product.id] = true;

    const doAdd = (cid: number) => {
      this.cartService.addItemToCart(cid, { productId: product.id, quantity: 1 }).subscribe({
        next: (updatedCart) => {
          if (updatedCart?.id && updatedCart.id !== this.cartId) {
            this.cartId = updatedCart.id;
            localStorage.setItem('cartId', String(updatedCart.id));
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
}
