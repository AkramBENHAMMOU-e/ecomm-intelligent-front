import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Product } from '../models/product.model';

const API_BASE_URL = 'http://localhost:8080';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly productsUrl = `${API_BASE_URL}/api/products`;
  
  // Cache pour les produits
  private productsCache: Product[] | null = null;
  private productsSubject = new BehaviorSubject<Product[]>([]);
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  getProducts(): Observable<Product[]> {
    const now = Date.now();
    
    // Si on a un cache valide et récent, le retourner
    if (this.productsCache && (now - this.lastFetchTime) < this.CACHE_DURATION) {
      return of(this.productsCache);
    }
    
    // Sinon, faire la requête et mettre à jour le cache
    return this.http.get<Product[]>(this.productsUrl).pipe(
      tap(products => {
        this.productsCache = products;
        this.lastFetchTime = now;
        this.productsSubject.next(products);
      }),
      catchError(error => {
        console.error('Erreur lors du chargement des produits:', error);
        // En cas d'erreur, retourner le cache s'il existe
        return of(this.productsCache || []);
      })
    );
  }
  
  // Méthode pour forcer le rechargement
  refreshProducts(): Observable<Product[]> {
    this.productsCache = null;
    this.lastFetchTime = 0;
    return this.getProducts();
  }
  
  // Méthode pour obtenir les produits depuis le cache
  getCachedProducts(): Product[] {
    return this.productsCache || [];
  }
    
    addProduct(product: Product): Observable<Product> {
      return this.http.post<Product>(this.productsUrl, product).pipe(
        tap(() => {
          // Invalider le cache après ajout
          this.invalidateCache();
        })
      );
    }

    getProductById(id: number): Observable<Product> {
      return this.http.get<Product>(`${this.productsUrl}/${id}`);
    }

    updateProduct(id: number, product: Product): Observable<Product> {
      return this.http.put<Product>(`${this.productsUrl}/${id}`, product).pipe(
        tap(() => {
          // Invalider le cache après modification
          this.invalidateCache();
        })
      );
    }

    deleteProduct(id: number): Observable<void> {
      return this.http.delete<void>(`${this.productsUrl}/${id}`).pipe(
        tap(() => {
          // Invalider le cache après suppression
          this.invalidateCache();
        })
      );
    }
    
    // Méthode privée pour invalider le cache
    private invalidateCache(): void {
      this.productsCache = null;
      this.lastFetchTime = 0;
    }

}
