import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../models/product.model';
import { Review, ProductReviewStats, CreateReviewRequest } from '../models/review.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private apiUrl = `${environment.backendHost}/api/reviews`;

  constructor(private http: HttpClient) { }

  // Créer un nouvel avis
  createReview(reviewData: CreateReviewRequest): Observable<Review> {
    return this.http.post<Review>(this.apiUrl, reviewData);
  }

  // Récupérer tous les avis d'un produit
  getReviewsByProduct(productId: number): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.apiUrl}/product/${productId}`);
  }

  // Récupérer les avis d'un produit avec pagination
  getReviewsByProductPaginated(productId: number, page: number = 0, size: number = 10): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/product/${productId}/paginated?page=${page}&size=${size}`);
  }

  // Obtenir les statistiques d'un produit
  getProductReviewStats(productId: number): Observable<ProductReviewStats> {
    return this.http.get<ProductReviewStats>(`${this.apiUrl}/product/${productId}/stats`);
  }

  // Récupérer les avis récents d'un produit
  getRecentReviews(productId: number): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.apiUrl}/product/${productId}/recent`);
  }

  // Récupérer les avis vérifiés d'un produit
  getVerifiedReviews(productId: number): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.apiUrl}/product/${productId}/verified`);
  }

  // Modérer un avis (admin seulement)
  moderateReview(reviewId: number, isVisible: boolean): Observable<Review> {
    return this.http.put<Review>(`${this.apiUrl}/${reviewId}/moderate`, { isVisible });
  }

  // Vérifier un avis (admin seulement)
  verifyReview(reviewId: number): Observable<Review> {
    return this.http.put<Review>(`${this.apiUrl}/${reviewId}/verify`, {});
  }

  // Supprimer un avis (admin seulement)
  deleteReview(reviewId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${reviewId}`);
  }

  // Méthodes utilitaires
  calculateAverageRating(reviews: Review[]): number {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / reviews.length;
  }

  filterByMinRating(reviews: Review[], minRating: number): Review[] {
    return reviews.filter(review => review.rating >= minRating);
  }

  getRatingDescription(rating: number): string {
    if (rating >= 4.5) return 'Excellent';
    if (rating >= 4.0) return 'Très bon';
    if (rating >= 3.5) return 'Bon';
    if (rating >= 3.0) return 'Moyen';
    if (rating >= 2.0) return 'Passable';
    return 'Faible';
  }

  isValidRating(rating: number): boolean {
    return rating >= 0 && rating <= 5;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
