import { Product } from './product.model';

export interface OrderItem {
  id?: number;
  product: Product;
  quantity: number;
  price: number;
}

export type StatusOrder = 'Processing' | 'Shipped' | 'Completed';

export interface Order {
  id?: number;
  date?: string; 
  status?: StatusOrder;
  customer?: any;
  items: OrderItem[];
}