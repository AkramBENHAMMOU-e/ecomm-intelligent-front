import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AddItemRequest, Cart } from '../models/cart.model';

const API_BASE_URL = 'http://localhost:8080';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/api/carts`;

  getCarts(): Observable<Cart[]> {
    return this.http.get<Cart[]>(this.baseUrl);
  }

  getCartById(id: number): Observable<Cart> {
    return this.http.get<Cart>(`${this.baseUrl}/${id}`);
  }

  createCart(cart: Cart): Observable<Cart> {
    return this.http.post<Cart>(this.baseUrl, cart);
  }

  addItemToCart(cartId: number, request: AddItemRequest): Observable<Cart> {
    return this.http.post<Cart>(`${this.baseUrl}/${cartId}/items`, request);
  }

  // Add method to update item quantity
  updateItemQuantity(cartId: number, itemId: number, quantity: number): Observable<Cart> {
    return this.http.put<Cart>(`${this.baseUrl}/${cartId}/items/${itemId}`, { quantity });
  }


  removeItemFromCart(cartId: number, itemId: number): Observable<Cart> {
    return this.http.delete<Cart>(`${this.baseUrl}/${cartId}/items/${itemId}`);
  }

  deleteCart(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}