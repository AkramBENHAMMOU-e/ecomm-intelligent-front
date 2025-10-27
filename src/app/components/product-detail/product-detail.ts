import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Product } from '../../models/product.model';
import { Review, ProductReviewStats } from '../../models/review.model';
import { ProductService } from '../../services/product.service';
import { ReviewService } from '../../services/review.service';
import { RecommendationService } from '../../services/recommendation.service';
import { CartService } from '../../services/cart.service';
import { Cart } from '../../models/cart.model';

@Component({
  selector: 'app-product-detail',
  standalone: false,
  templateUrl: './product-detail.html',
  styleUrls: ['./product-detail.css']
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productService = inject(ProductService);
  private readonly reviewService = inject(ReviewService);
  private readonly recommendationService = inject(RecommendationService);
  private readonly cartService = inject(CartService);

  product: Product | null = null;
  recommendedProducts: Product[] = [];
  comments: Review[] = [];
  reviewStats: ProductReviewStats | null = null;
  
  loading = true;
  error = '';
  quantity = 1;
  adding = false;
  
  // Commentaires
  newComment = {
    customerName: '',
    customerEmail: '',
    rating: 0,
    comment: ''
  };
  publishingComment = false;
  showCommentForm = false;
  
  // Pagination des commentaires
  currentCommentsPage = 0;
  commentsPerPage = 3;
  
  // Carousel des recommandations
  carouselIndex = 0;
  carouselInterval: any;
  
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
        this.loadReviewStats();
        this.loadComments();
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
        if (this.recommendedProducts.length > 0) {
          this.startCarousel();
        }
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

  // Méthodes pour gérer les avis
  onReviewAdded(review: Review) {
    console.log('Nouvel avis ajouté:', review);
    // Optionnel: recharger les recommandations ou faire d'autres actions
  }

  // Méthodes pour les évaluations
  getProductRating(): number {
    return this.reviewStats?.averageRating || 0;
  }

  getReviewCount(): number {
    return this.reviewStats?.reviewCount || 0;
  }

  getRatingDescription(rating: number): string {
    if (rating >= 4.5) return 'Excellent';
    if (rating >= 4.0) return 'Très bon';
    if (rating >= 3.5) return 'Bon';
    if (rating >= 3.0) return 'Moyen';
    if (rating >= 2.0) return 'Passable';
    return 'Faible';
  }

  getRecommendationRating(product: Product): number | null {
    // Pour l'instant, retourner null car nous n'avons pas encore implémenté les ratings pour les recommandations
    return null;
  }

  // Méthodes pour les commentaires
  setCommentRating(rating: number) {
    this.newComment.rating = rating;
  }

  getRatingText(rating: number): string {
    if (rating === 0) return 'Sélectionnez une note';
    return this.getRatingDescription(rating);
  }

  isCommentValid(): boolean {
    return this.newComment.customerName.trim() !== '' &&
           this.newComment.customerEmail.trim() !== '' &&
           this.newComment.rating > 0;
  }

  publishComment() {
    if (!this.isCommentValid() || !this.product) return;

    this.publishingComment = true;
    
    const reviewData = {
      productId: this.product.id,
      customerName: this.newComment.customerName,
      customerEmail: this.newComment.customerEmail,
      rating: this.newComment.rating,
      comment: this.newComment.comment
    };

    this.reviewService.createReview(reviewData).subscribe({
      next: (review) => {
        this.comments.unshift(review);
        this.loadReviewStats();
        this.resetCommentForm();
        this.publishingComment = false;
      },
      error: (error) => {
        console.error('Erreur lors de la publication du commentaire:', error);
        this.publishingComment = false;
      }
    });
  }

  resetCommentForm() {
    this.newComment = {
      customerName: '',
      customerEmail: '',
      rating: 0,
      comment: ''
    };
    this.showCommentForm = false;
  }

  toggleCommentForm() {
    this.showCommentForm = !this.showCommentForm;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Méthodes pour charger les données
  loadReviewStats() {
    if (!this.product) return;
    
    this.reviewService.getProductReviewStats(this.product.id).subscribe({
      next: (stats) => {
        this.reviewStats = stats;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des statistiques:', error);
      }
    });
  }

  loadComments() {
    if (!this.product) return;
    
    this.reviewService.getReviewsByProduct(this.product.id).subscribe({
      next: (reviews) => {
        this.comments = reviews;
        this.currentCommentsPage = 0;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des commentaires:', error);
      }
    });
  }

  // Pagination des commentaires
  get totalCommentsPages(): number {
    return Math.ceil(this.comments.length / this.commentsPerPage);
  }

  get paginatedComments(): Review[] {
    const start = this.currentCommentsPage * this.commentsPerPage;
    const end = start + this.commentsPerPage;
    return this.comments.slice(start, end);
  }

  nextCommentsPage() {
    if (this.currentCommentsPage < this.totalCommentsPages - 1) {
      this.currentCommentsPage++;
    }
  }

  previousCommentsPage() {
    if (this.currentCommentsPage > 0) {
      this.currentCommentsPage--;
    }
  }

  goToCommentsPage(page: number) {
    this.currentCommentsPage = page;
  }

  // Carousel des recommandations
  startCarousel() {
    if (this.recommendedProducts.length <= 3) {
      return; // Pas besoin de carousel si on a 3 produits ou moins
    }
    this.carouselInterval = setInterval(() => {
      this.carouselIndex = (this.carouselIndex + 1) % Math.ceil(this.recommendedProducts.length / 3);
    }, 4000); // Change toutes les 4 secondes
  }

  stopCarousel() {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
    }
  }

  getCarouselProducts(): Product[] {
    const start = this.carouselIndex * 3;
    return this.recommendedProducts.slice(start, start + 3);
  }

  nextCarousel() {
    const maxIndex = Math.ceil(this.recommendedProducts.length / 3) - 1;
    this.carouselIndex = (this.carouselIndex + 1) % (maxIndex + 1);
    this.stopCarousel();
    this.startCarousel();
  }

  previousCarousel() {
    const maxIndex = Math.ceil(this.recommendedProducts.length / 3) - 1;
    this.carouselIndex = this.carouselIndex === 0 ? maxIndex : this.carouselIndex - 1;
    this.stopCarousel();
    this.startCarousel();
  }

  ngOnDestroy() {
    this.stopCarousel();
  }
}

