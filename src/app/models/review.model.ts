export interface Review {
  id?: number;
  productId: number;
  customerName: string;
  customerEmail: string;
  rating: number;
  comment?: string;
  createdAt?: string;
  updatedAt?: string;
  isVerified?: boolean;
  isVisible?: boolean;
}

export interface ProductReviewStats {
  averageRating: number;
  reviewCount: number;
  ratingDescription?: string;
}

export interface CreateReviewRequest {
  productId: number;
  customerName: string;
  customerEmail: string;
  rating: number;
  comment?: string;
}
