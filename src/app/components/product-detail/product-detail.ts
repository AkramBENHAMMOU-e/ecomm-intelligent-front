import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Product } from '../../models/product.model';
import { ProductService } from '../../services/product.service';
import { RecommendationService } from '../../services/recommendation.service';
import { CartService } from '../../services/cart.service';
import { Cart } from '../../models/cart.model';

@Component({
  selector: 'app-product-detail',
  standalone: false,
  templateUrl: './product-detail.html',
  styleUrls: ['./product-detail.css']
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productService = inject(ProductService);
  private readonly recommendationService = inject(RecommendationService);
  private readonly cartService = inject(CartService);

  product: Product | null = null;
  recommendedProducts: Product[] = [];
  loading = true;
  error = '';
  quantity = 1;
  adding = false;
  private cartId: number | null = null;

  ngOnInit() {
    this.restoreCartId();
    this.route.params.subscribe(params => {
      const id = +params['id'];
      if (id) {
        this.loadProduct(id);
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

  loadProduct(id: number) {
    this.loading = true;
    this.error = '';

    this.productService.getProductById(id).subscribe({
      next: (product) => {
        this.product = product;
        this.loading = false;
        this.loadRecommendations(id);
      },
      error: (err: any) => {
        this.error = 'Erreur lors du chargement du produit';
        this.loading = false;
        console.error(err);
      }
    });
  }

  loadRecommendations(productId: number) {
    this.recommendationService.getSimilar(productId, 4).subscribe({
      next: (products) => {
        this.recommendedProducts = products.filter(p => p.id !== productId);
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement des recommandations:', err);
      }
    });
  }

  addToCart() {
    if (!this.product) return;

    this.adding = true;
    const quantity = Math.max(1, Math.floor(this.quantity || 1));

    const doAdd = (cid: number) => {
      this.cartService.addItemToCart(cid, { productId: this.product!.id, quantity }).subscribe({
        next: (updatedCart) => {
          if (updatedCart?.id) {
            if (updatedCart.id !== this.cartId) {
              this.cartId = updatedCart.id;
              localStorage.setItem('cartId', String(updatedCart.id));
            }
          }
          this.adding = false;
          alert('Produit ajouté au panier avec succès!');
        },
        error: (err: any) => {
          this.adding = false;
          alert('Erreur lors de l\'ajout au panier');
          console.error(err);
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
        error: (err: any) => {
          console.error('Failed to create cart', err);
          this.adding = false;
          alert('Création du panier échouée.');
        }
      });
    }
  }

  goToProduct(productId: number) {
    this.router.navigate(['/product', productId]);
  }

  goBack() {
    this.router.navigate(['/']);
  }

  increaseQuantity() {
    this.quantity++;
  }

  decreaseQuantity() {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }
}

