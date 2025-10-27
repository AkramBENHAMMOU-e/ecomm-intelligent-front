import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_BASE_URL = 'http://localhost:8080';

export interface DescriptionRequest {
  name: string;
  category: string;
  price: number;
  additionalAttributes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DescriptionGenerationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/api/products`;

  /**
   * Génère une description pour un produit en utilisant le service AI du backend
   */
  generateDescription(request: DescriptionRequest): Observable<string> {
    return this.http.post(`${this.baseUrl}/generate-description`, request, { 
      responseType: 'text' 
    });
  }

  /**
   * Génère une description basée sur les informations du produit
   */
  generateDescriptionForProduct(
    name: string, 
    category: string, 
    price: number, 
    quantity?: number,
    brand?: string,
    origin?: string
  ): Observable<string> {
    const additionalAttributes = this.buildAdditionalAttributes(quantity, brand, origin);
    
    const request: DescriptionRequest = {
      name,
      category,
      price,
      additionalAttributes
    };

    return this.generateDescription(request);
  }

  /**
   * Construit les attributs supplémentaires pour la génération
   */
  private buildAdditionalAttributes(quantity?: number, brand?: string, origin?: string): string {
    const attributes: string[] = [];
    
    if (quantity) {
      attributes.push(`Quantité disponible: ${quantity}`);
    }
    
    if (brand) {
      attributes.push(`Marque: ${brand}`);
    }
    
    if (origin) {
      attributes.push(`Origine: ${origin}`);
    }
    
    return attributes.join(', ');
  }
}
