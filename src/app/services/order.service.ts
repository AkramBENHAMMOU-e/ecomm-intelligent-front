import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order, StatusOrder, CheckoutRequest } from '../models/order.model';

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

  updateOrder(id: number, updatedOrder: Order): Observable<Order> {
    return this.http.put<Order>(`${this.baseUrl}/${id}`, updatedOrder);
  }

  updateOrderStatus(id: number, status: StatusOrder): Observable<Order> {
    return this.http.patch<Order>(`${this.baseUrl}/${id}/status`, { status });
  }

  shipOrder(id: number): Observable<Order> {
    return this.http.put<Order>(`${this.baseUrl}/${id}/ship`, {});
  }

  deleteOrder(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  checkout(request: CheckoutRequest): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}/checkout`, request);
  }
}