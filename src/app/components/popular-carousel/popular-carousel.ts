import { Component, Input, OnInit, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { ReviewService } from '../../services/review.service';
import { Cart } from '../../models/cart.model';
import { Product } from '../../models/product.model';
import { ProductReviewStats } from '../../models/review.model';

@Component({
  selector: 'app-popular-carousel',
  standalone: false,
  templateUrl: './popular-carousel.html',
  styleUrls: ['./popular-carousel.css']
})
export class PopularCarousel implements OnInit, AfterViewInit, OnDestroy {
  @Input() products: Product[] = [];
  @ViewChild('carouselWrapper', { static: true }) carouselWrapper!: ElementRef;

  currentIndex = 0;
  itemsToShow = 3;
  currentOffset = 0;
  addingToCart: { [key: number]: boolean } = {};
  
  // Cart management
  cartId: number | null = null;
  
  // Ratings et avis
  productRatings: Map<number, ProductReviewStats> = new Map();

  // Animation et auto-play
  autoPlayInterval: any;
  autoPlayDelay = 5000; // 5 secondes

  constructor(
    private router: Router,
    private cartService: CartService,
    private reviewService: ReviewService
  ) {}

  ngOnInit() {
    this.updateItemsToShow();
    this.startAutoPlay();
    this.restoreCartId();
    this.loadProductRatings();
  }

  ngAfterViewInit() {
    this.updateCarousel();
    window.addEventListener('resize', () => {
      this.updateItemsToShow();
      this.updateCarousel();
    });
  }

  ngOnDestroy() {
    this.stopAutoPlay();
  }

  private updateItemsToShow() {
    const width = window.innerWidth;
    if (width < 768) {
      this.itemsToShow = 1;
    } else if (width < 1024) {
      this.itemsToShow = 2;
    } else {
      this.itemsToShow = 3;
    }
  }

  private updateCarousel() {
    if (this.carouselWrapper) {
      const wrapper = this.carouselWrapper.nativeElement as HTMLElement;
      const cardWidth = wrapper.querySelector('.carousel-item')?.clientWidth || 300;
      this.currentOffset = -this.currentIndex * (cardWidth + 20); // 20px margin
    }
  }

  nextSlide() {
    if (this.currentIndex < this.products.length - this.itemsToShow) {
      this.currentIndex++;
      this.updateCarousel();
      this.resetAutoPlay();
    }
  }

  previousSlide() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.updateCarousel();
      this.resetAutoPlay();
    }
  }

  goToSlide(index: number) {
    if (index >= 0 && index <= this.products.length - this.itemsToShow) {
      this.currentIndex = index;
      this.updateCarousel();
      this.resetAutoPlay();
    }
  }

  private startAutoPlay() {
    this.autoPlayInterval = setInterval(() => {
      if (this.currentIndex < this.products.length - this.itemsToShow) {
        this.nextSlide();
      } else {
        this.currentIndex = 0;
        this.updateCarousel();
      }
    }, this.autoPlayDelay);
  }

  private stopAutoPlay() {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
    }
  }

  private resetAutoPlay() {
    this.stopAutoPlay();
    this.startAutoPlay();
  }

  quickView(product: Product) {
    this.router.navigate(['/product', product.id]);
  }

  addToCart(product: Product) {
    if (this.addingToCart[product.id]) return;
    this.addingToCart[product.id] = true;

    const doAdd = (cid: number) => {
      this.cartService.addItemToCart(cid, { productId: product.id, quantity: 1 }).subscribe({
        next: (updatedCart) => {
          if (updatedCart?.id) {
            if (updatedCart.id !== this.cartId) {
              this.cartId = updatedCart.id;
              localStorage.setItem('cartId', String(updatedCart.id));
            }
          }
          this.addingToCart[product.id] = false;
          this.showSuccessNotification(`${product.name} ajouté au panier !`);
        },
        error: (err) => {
          console.error('Failed to add item to cart', err);
          this.addingToCart[product.id] = false;
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
          if (!created?.id) {
            throw new Error('Cart creation failed: missing id');
          }
          this.cartId = created.id as number;
          localStorage.setItem('cartId', String(this.cartId));
          doAdd(this.cartId);
        },
        error: (err) => {
          console.error('Failed to create cart', err);
          this.addingToCart[product.id] = false;
          alert('Création du panier échouée.');
        }
      });
    }
  }

  restoreCartId(): void {
    const savedCartId = localStorage.getItem('cartId');
    if (savedCartId) {
      this.cartId = parseInt(savedCartId, 10);
    }
  }

  private showSuccessNotification(message: string) {
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
      padding: 12px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
      animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    // Animation CSS keyframes
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in forwards';
      setTimeout(() => {
        document.body.removeChild(notification);
        document.head.removeChild(style);
      }, 300);
    }, 3000);
  }

  // Méthodes pour gérer les ratings
  getProductRating(product: Product): number | null {
    const stats = this.productRatings.get(product.id);
    return stats ? stats.averageRating : null;
  }

  loadProductRatings() {
    this.products.forEach(product => {
      this.reviewService.getProductReviewStats(product.id).subscribe({
        next: (stats) => {
          this.productRatings.set(product.id, stats);
        },
        error: (error) => {
          console.error(`Erreur lors du chargement des statistiques pour le produit ${product.id}:`, error);
        }
      });
    });
  }
}
