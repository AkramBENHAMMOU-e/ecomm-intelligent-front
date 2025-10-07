import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../models/product.model';

const API_BASE_URL = 'http://localhost:8080';

@Injectable({ providedIn: 'root' })
export class RecommendationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/api/recommendations`;

  /**
   * Retourne des produits recommandés similaires à un produit donné
   * GET /api/recommendations/product/{productId}?limit=5
   */
  getSimilar(productId: number, limit = 6): Observable<Product[]> {
    const params = new HttpParams().set('limit', limit);
    return this.http.get<Product[]>(`${this.baseUrl}/product/${productId}`, { params });
  }
}
