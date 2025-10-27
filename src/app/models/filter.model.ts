export interface ProductFilters {
  name?: string;
  origin?: string[] | string;
  roastLevel?: string[] | string;
  brand?: string[] | string;
  region?: string[] | string;
  process?: string[] | string;
  minPrice?: number;
  maxPrice?: number;
}

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}
