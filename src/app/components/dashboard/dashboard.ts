import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Product } from '../../models/product.model';
import { ProductService } from '../../services/product.service';
import { Auth } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  products: Product[] = [];
  loading = false;
  error: string | null = null;
  searchTerm: string = '';
  
  // Modal state
  showProductModal = false;
  modalProduct: Product | null = null;
  isEditMode = false;

  constructor(
    private productService: ProductService,
    private router: Router,
    private authService: Auth
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.error = null;
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = data ?? [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load products', err);
        this.error = 'Impossible de charger les produits';
        this.loading = false;
      }
    });
  }

  navigateToAddProduct(): void {
    this.openProductModal();
  }

  editProduct(productId: number): void {
    const product = this.products.find(p => p.id === productId);
    if (product) {
      this.openProductModal(product);
    }
  }

  openProductModal(product?: Product): void {
    if (product) {
      this.modalProduct = { ...product };
      this.isEditMode = true;
    } else {
      this.modalProduct = {
        id: undefined as any,
        name: '',
        description: '',
        price: 0,
        quantity: 1,
        category: '',
        image: ''
      };
      this.isEditMode = false;
    }
    this.showProductModal = true;
  }

  closeProductModal(): void {
    this.showProductModal = false;
    this.modalProduct = null;
    this.isEditMode = false;
  }

  onProductSaved(): void {
    this.closeProductModal();
    this.loadProducts();
  }

  deleteProduct(product: Product): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le produit "${product.name}" ?`)) {
      this.productService.deleteProduct(product.id).subscribe({
        next: () => {
          console.log('Product deleted successfully:', product.id);
          this.loadProducts();
        },
        error: (err) => {
          console.error('Failed to delete product', err);
          alert('Impossible de supprimer le produit. Veuillez réessayer.');
        }
      });
    }
  }

  refreshProducts(): void {
    this.loadProducts();
  }

  // Filtered products based on search term (dashboard)
  get filteredProducts(): Product[] {
    const term = (this.searchTerm || '').trim().toLowerCase();
    if (!term) return this.products;
    return this.products.filter(p => {
      const name = (p.name || '').toLowerCase();
      const desc = (p.description || '').toLowerCase();
      const cat = (p.category || '').toLowerCase();
      return name.includes(term) || desc.includes(term) || cat.includes(term);
    });
  }

  // Method to handle admin logout
  logout(): void {
    this.authService.logout();
  }

  // Navigation methods
  navigateToOrders(): void {
    this.router.navigate(['/orders']);
  }

  navigateToCustomers(): void {
    this.router.navigate(['/customers']);
  }

  showProductsSection(): void {
    // Already on products section, no action needed
  }
}
