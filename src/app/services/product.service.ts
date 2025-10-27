import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Product } from '../models/product.model';
import { ProductReviewStats } from '../models/review.model';
import { Page, PaginationParams } from '../models/pagination.model';

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
  
  // Search state
  private searchTermSubject = new BehaviorSubject<string>('');

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
          this.invalidateCacheInternal();
        })
      );
    }

    getProductById(id: number): Observable<Product> {
      return this.http.get<Product>(`${this.productsUrl}/${id}`);
    }

    getProductReviewStats(id: number): Observable<ProductReviewStats> {
      return this.http.get<ProductReviewStats>(`${this.productsUrl}/${id}/review-stats`);
    }

    updateProduct(id: number, product: Product): Observable<Product> {
      return this.http.put<Product>(`${this.productsUrl}/${id}`, product).pipe(
        tap(() => {
          // Invalider le cache après modification
          this.invalidateCacheInternal();
        })
      );
    }

    deleteProduct(id: number): Observable<void> {
      return this.http.delete<void>(`${this.productsUrl}/${id}`).pipe(
        tap(() => {
          // Invalider le cache après suppression
          this.invalidateCacheInternal();
        })
      );
    }
    
  // Méthode publique pour invalider le cache
  invalidateCache(): void {
    this.productsCache = null;
    this.lastFetchTime = 0;
    console.log('🗑️ Cache des produits invalidé');
  }
  
  // Méthode privée pour invalider le cache (utilisée en interne)
  private invalidateCacheInternal(): void {
    this.invalidateCache();
  }

  // Search methods
  setSearchTerm(searchTerm: string): void {
    this.searchTermSubject.next(searchTerm);
  }

  getSearchTerm(): Observable<string> {
    return this.searchTermSubject.asObservable();
  }

  // Nouvelle méthode pour la recherche avec filtres
  searchProducts(filters: {
    name?: string;
    origin?: string;
    roastLevel?: string;
    brand?: string;
    region?: string;
    process?: string;
    minPrice?: number;
    maxPrice?: number;
  }): Observable<Product[]> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const searchUrl = `${this.productsUrl}/search${params.toString() ? '?' + params.toString() : ''}`;
    
    return this.http.get<Product[]>(searchUrl).pipe(
      catchError(error => {
        console.error('Erreur lors de la recherche des produits:', error);
        return of([]);
      })
    );
  }

  // Méthodes de pagination
  getProductsPaginated(params: PaginationParams): Observable<Page<Product>> {
    const httpParams = new HttpParams()
      .set('page', params.page.toString())
      .set('size', params.size.toString());
    
    if (params.sort) {
      httpParams.set('sort', params.sort);
    }

    return this.http.get<Page<Product>>(`${this.productsUrl}/paginated`, { params: httpParams }).pipe(
      catchError(error => {
        console.error('Erreur lors du chargement des produits paginés:', error);
        return of({
          content: [],
          totalElements: 0,
          totalPages: 0,
          size: params.size,
          number: params.page,
          numberOfElements: 0,
          first: true,
          last: true,
          empty: true
        });
      })
    );
  }

  searchProductsPaginated(filters: {
    name?: string;
    origin?: string;
    roastLevel?: string;
    brand?: string;
    region?: string;
    process?: string;
    minPrice?: number;
    maxPrice?: number;
  }, params: PaginationParams): Observable<Page<Product>> {
    let httpParams = new HttpParams()
      .set('page', params.page.toString())
      .set('size', params.size.toString());
    
    if (params.sort) {
      httpParams = httpParams.set('sort', params.sort);
    }

    // Ajouter les filtres
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, value.toString());
      }
    });

    return this.http.get<Page<Product>>(`${this.productsUrl}/search/paginated`, { params: httpParams }).pipe(
      catchError(error => {
        console.error('Erreur lors de la recherche paginée des produits:', error);
        return of({
          content: [],
          totalElements: 0,
          totalPages: 0,
          size: params.size,
          number: params.page,
          numberOfElements: 0,
          first: true,
          last: true,
          empty: true
        });
      })
    );
  }

}
