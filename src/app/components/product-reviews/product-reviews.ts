import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Review, ProductReviewStats, CreateReviewRequest } from '../../models/review.model';
import { ReviewService } from '../../services/review.service';

@Component({
  selector: 'app-product-reviews',
  standalone: false,
  templateUrl: './product-reviews.html',
  styleUrls: ['./product-reviews.css']
})
export class ProductReviewsComponent implements OnInit {
  @Input() productId!: number;
  @Output() reviewAdded = new EventEmitter<Review>();

  reviews: Review[] = [];
  reviewStats: ProductReviewStats | null = null;
  showAddForm = false;
  submitting = false;

  newReview: CreateReviewRequest = {
    productId: 0,
    customerName: '',
    customerEmail: '',
    rating: 0,
    comment: ''
  };

  constructor(private reviewService: ReviewService) {}

  ngOnInit() {
    this.loadReviews();
    this.loadReviewStats();
  }

  loadReviews() {
    this.reviewService.getReviewsByProduct(this.productId).subscribe({
      next: (reviews) => {
        this.reviews = reviews;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des avis:', error);
      }
    });
  }

  loadReviewStats() {
    this.reviewService.getProductReviewStats(this.productId).subscribe({
      next: (stats) => {
        this.reviewStats = stats;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des statistiques:', error);
      }
    });
  }

  showAddReviewForm() {
    this.newReview.productId = this.productId;
    this.showAddForm = true;
  }

  cancelAddReview() {
    this.showAddForm = false;
    this.newReview = {
      productId: this.productId,
      customerName: '',
      customerEmail: '',
      rating: 0,
      comment: ''
    };
  }

  setRating(rating: number) {
    this.newReview.rating = rating;
  }

  submitReview(form: any) {
    if (form.valid && this.newReview.rating > 0) {
      this.submitting = true;
      
      this.reviewService.createReview(this.newReview).subscribe({
        next: (review) => {
          this.reviews.unshift(review);
          this.loadReviewStats();
          this.cancelAddReview();
          this.reviewAdded.emit(review);
          this.submitting = false;
        },
        error: (error) => {
          console.error('Erreur lors de la création de l\'avis:', error);
          this.submitting = false;
        }
      });
    }
  }

  getRatingDescription(rating: number): string {
    return this.reviewService.getRatingDescription(rating);
  }

  formatDate(dateString: string): string {
    return this.reviewService.formatDate(dateString);
  }
}
