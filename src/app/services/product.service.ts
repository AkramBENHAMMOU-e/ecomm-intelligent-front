  import { Injectable, inject } from '@angular/core';
  import { HttpClient } from '@angular/common/http';
  import { Observable } from 'rxjs';
  import { Product } from '../models/product.model';

  const API_BASE_URL = 'http://localhost:8080';

  @Injectable({ providedIn: 'root' })
  export class ProductService {
    private readonly http = inject(HttpClient);
    private readonly productsUrl = `${API_BASE_URL}/api/products`;

    getProducts(): Observable<Product[]> {
      return this.http.get<Product[]>(this.productsUrl);
    }
    
    addProduct(product: Product): Observable<Product> {
      return this.http.post<Product>(this.productsUrl, product);
    }

    getProductById(id: number): Observable<Product> {
      return this.http.get<Product>(`${this.productsUrl}/${id}`);
    }

    updateProduct(id: number, product: Product): Observable<Product> {
      return this.http.put<Product>(`${this.productsUrl}/${id}`, product);
    }

    deleteProduct(id: number): Observable<void> {
      return this.http.delete<void>(`${this.productsUrl}/${id}`);
    }

}
