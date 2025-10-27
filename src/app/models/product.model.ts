export interface Product {
  id: number;
  name: string;
  description: string;
  image: string;
  price: number;
  quantity: number;
  category?: string;
  brand: string;
  origin: string;
  region?: string;
  process?: string;
  roastLevel?: string;
  tastingNotes?: string;
  weight?: number;
  isActive?: boolean;
  discount?: number;
}
