import { Product } from './product.model';

export interface OrderItem {
  id?: number;
  product: Product;
  quantity: number;
  price: number;
}

export type StatusOrder = 'Processing' | 'Shipped' | 'Completed';

export interface Customer {
  customer_id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  orders?: Order[];
}

export interface CheckoutRequest {
  cartId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
}

export interface Order {
  id?: number;
  date?: string; 
  status?: StatusOrder;
  customer?: Customer;
  items: OrderItem[];
  phoneNumber?: string;
}