import { Product } from './product.model';

export interface OrderItem {
  id?: number;
  product: Product;
  quantity: number;
  price: number;
}

export type StatusOrder = 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | string;

export interface Order {
  id?: number;
  date?: string; // ISO date from backend
  status?: StatusOrder;
  customer?: any;
  items: OrderItem[];
}
