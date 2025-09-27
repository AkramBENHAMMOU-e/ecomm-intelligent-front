import { Product } from './product.model';

export interface CartItem {
  id?: number;
  product: Product;
  quantity: number;
}

export interface Cart {
  id?: number;
  customerId?: number | string | null;
  items: CartItem[];
}

export interface AddItemRequest {
  productId: number;
  quantity: number;
}
