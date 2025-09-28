import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order } from '../models/order.model';

const API_BASE_URL = 'http://localhost:8080';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/api/orders`;

  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(this.baseUrl);
  }

  getOrderById(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.baseUrl}/${id}`);
  }

  createOrder(order: Order): Observable<Order> {
    return this.http.post<Order>(this.baseUrl, order);
  }

  checkout(cartId: number): Observable<Order> {
    const params = new HttpParams().set('cartId', String(cartId));
    return this.http.post<Order>(`${this.baseUrl}/checkout`, null, { params });
  }
}
