import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../models/product.model';

/**
 * Service to fetch products from backend API.
 *
 * TODO: Replace API_BASE_URL with your Spring API base URL.
 * Example: http://localhost:8080
 */
const API_BASE_URL = 'http://localhost:8080'; // <- Replace with your Spring API base URL

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly productsUrl = `${API_BASE_URL}/api/products`;

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.productsUrl);
  }
}
