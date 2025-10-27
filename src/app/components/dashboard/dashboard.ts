import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Product } from '../../models/product.model';
import { ProductService } from '../../services/product.service';
import { Auth } from '../../services/auth.service';
import { OrderService } from '../../services/order.service';
import { CustomerService } from '../../services/customer.service';
import { AspectDataService, AspectData } from '../../services/aspect-data';
import { Order, Customer, StatusOrder } from '../../models/order.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  products: Product[] = [];
  orders: Order[] = [];
  customers: Customer[] = [];
  loading = false;
  error: string | null = null;
  searchTerm: string = '';
  
  // Modal state
  showProductModal = false;
  modalProduct: Product | null = null;
  isEditMode = false;
  
  // Order editing state
  editingOrderId: number | null = null;
  newStatus: StatusOrder = 'Processing';
  
  // Order details modal state
  showOrderDetailsModal = false;
  selectedOrder: Order | null = null;
  
  // Customer details modal state
  showCustomerDetailsModal = false;
  selectedCustomer: Customer | null = null;
  
  // Customer orders modal state
  showCustomerOrdersModal = false;
  
  // Active section state
  activeSection: 'products' | 'orders' | 'customers' | 'sentiments' = 'products';

  // Sentiment analysis data
  allProductsAspectData: Array<{ productId: number; data: AspectData[] }> = [];

  // Stats modal state
  showStatsModal = false;
  selectedProductForStats: Product | null = null;
  productStatsData: AspectData[] | null = null;

  constructor(
    private productService: ProductService,
    private orderService: OrderService,
    private customerService: CustomerService,
    private aspectDataService: AspectDataService,
    public router: Router,
    private authService: Auth
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadOrders();
    this.loadCustomers();
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
        image: '',
        brand: '',
        origin: '',
        region: '',
        process: '',
        roastLevel: '',
        tastingNotes: '',
        weight: 0,
        isActive: true
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

  loadOrders(): void {
    this.orderService.getOrders().subscribe({
      next: (data) => {
        this.orders = data ?? [];
        this.linkOrdersToCustomers(); // Lier les commandes aux clients
      },
      error: (err) => {
        console.error('Failed to load orders', err);
      }
    });
  }

  loadCustomers(): void {
    this.customerService.getAllCustomers().subscribe({
      next: (data) => {
        this.customers = data ?? [];
        this.linkOrdersToCustomers(); // Lier les commandes aux clients
      },
      error: (err) => {
        console.error('Failed to load customers', err);
      }
    });
  }

  // Méthode pour lier les commandes aux clients
  private linkOrdersToCustomers(): void {
    if (this.orders.length === 0 || this.customers.length === 0) {
      return;
    }

    // Créer un map des clients par ID pour un accès rapide
    const customerMap = new Map<number, Customer>();
    this.customers.forEach(customer => {
      customerMap.set(customer.customer_id, customer);
      customer.orders = []; // Initialiser le tableau des commandes
    });

    // Lier chaque commande à son client
    this.orders.forEach(order => {
      if (order.customer?.customer_id) {
        const customer = customerMap.get(order.customer.customer_id);
        if (customer) {
          customer.orders = customer.orders || [];
          customer.orders.push(order);
        }
      }
    });

    console.log('Orders linked to customers:', this.customers.map(c => ({
      name: `${c.firstName} ${c.lastName}`,
      ordersCount: c.orders?.length || 0
    })));
  }

  refreshOrders(): void {
    this.loadOrders();
  }

  refreshCustomers(): void {
    this.loadCustomers();
  }

  // Méthode pour rafraîchir toutes les données et relancer la liaison
  refreshAllData(): void {
    this.loadProducts();
    this.loadOrders();
    this.loadCustomers();
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

  // Filtered customers based on search term
  get filteredCustomers(): Customer[] {
    const term = (this.searchTerm || '').trim().toLowerCase();
    if (!term) return this.customers;
    return this.customers.filter(c => {
      const firstName = (c.firstName || '').toLowerCase();
      const lastName = (c.lastName || '').toLowerCase();
      const email = (c.email || '').toLowerCase();
      const phone = (c.phone || '').toLowerCase();
      return firstName.includes(term) || lastName.includes(term) || email.includes(term) || phone.includes(term);
    });
  }

  // Method to handle admin logout
  logout(): void {
    this.authService.logout();
  }

  // Navigation methods - now change active section instead of routing
  navigateToOrders(): void {
    this.activeSection = 'orders';
  }

  navigateToCustomers(): void {
    this.activeSection = 'customers';
  }

  navigateToSentiments(): void {
    this.activeSection = 'sentiments';
    this.loadAllProductsAspectData();
  }

  showProductsSection(): void {
    this.activeSection = 'products';
  }

  // Order management methods
  getOrderTotal(order: Order): number {
    return order.items?.reduce((total, item) => total + (item.price * item.quantity), 0) || 0;
  }

  getOrderQuantity(order: Order): number {
    return order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
  }

  getStatusClass(status?: StatusOrder): string {
    switch (status) {
      case 'Processing':
        return 'status-processing';
      case 'Shipped':
        return 'status-shipped';
      case 'Completed':
        return 'status-completed';
      default:
        return 'status-unknown';
    }
  }

  viewOrder(order: Order): void {
    this.selectedOrder = order;
    this.showOrderDetailsModal = true;
  }

  closeOrderDetailsModal(): void {
    this.showOrderDetailsModal = false;
    this.selectedOrder = null;
  }

  // Customer management methods
  viewCustomer(customer: Customer): void {
    this.selectedCustomer = customer;
    this.showCustomerDetailsModal = true;
  }

  closeCustomerDetailsModal(): void {
    this.showCustomerDetailsModal = false;
    this.selectedCustomer = null;
  }

  viewCustomerOrders(customer: Customer): void {
    this.selectedCustomer = customer;
    this.showCustomerOrdersModal = true;
  }

  closeCustomerOrdersModal(): void {
    this.showCustomerOrdersModal = false;
    this.selectedCustomer = null;
  }

  viewOrderFromCustomer(order: Order): void {
    this.selectedOrder = order;
    this.showOrderDetailsModal = true;
    this.closeCustomerDetailsModal();
    this.closeCustomerOrdersModal();
  }

  getCustomerOrders(customer: Customer): Order[] {
    // Utiliser les commandes déjà liées au client
    return customer.orders || [];
  }

  getCustomerTotalOrders(customer: Customer): number {
    // Compter toutes les commandes du client dans la base de données
    return this.orders.filter(order => order.customer?.customer_id === customer.customer_id).length;
  }

  startEditing(order: Order): void {
    this.editingOrderId = order.id!;
    this.newStatus = order.status || 'Processing';
  }

  cancelEditing(): void {
    this.editingOrderId = null;
  }

  saveStatus(order: Order): void {
    if (!this.editingOrderId) return;

    // Si le statut est "Shipped", utiliser l'API shipOrder
    if (this.newStatus === 'Shipped') {
      this.orderService.shipOrder(this.editingOrderId).subscribe({
        next: (updatedOrder) => {
          console.log('Order shipped successfully:', updatedOrder);
          const index = this.orders.findIndex(o => o.id === this.editingOrderId);
          if (index !== -1) {
            this.orders[index] = updatedOrder;
          }
          this.editingOrderId = null;
        },
        error: (err) => {
          console.error('Failed to ship order', err);
          alert('Impossible d\'expédier la commande. Veuillez réessayer.');
        }
      });
    } else {
      // Pour les autres statuts, utiliser la méthode générique
      const updatedOrder = { ...order, status: this.newStatus };

      this.orderService.updateOrder(this.editingOrderId, updatedOrder).subscribe({
        next: (updatedOrder) => {
          console.log('Order updated successfully:', updatedOrder);
          const index = this.orders.findIndex(o => o.id === this.editingOrderId);
          if (index !== -1) {
            this.orders[index] = updatedOrder;
          }
          this.editingOrderId = null;
        },
        error: (err) => {
          console.error('Failed to update order', err);
          alert('Impossible de mettre à jour la commande. Veuillez réessayer.');
        }
      });
    }
  }

  deleteOrder(order: Order): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la commande #${order.id} ?`)) {
      this.orderService.deleteOrder(order.id!).subscribe({
        next: () => {
          console.log('Order deleted successfully:', order.id);
          this.orders = this.orders.filter(o => o.id !== order.id);
        },
        error: (err) => {
          console.error('Failed to delete order', err);
          alert('Impossible de supprimer la commande. Veuillez réessayer.');
        }
      });
    }
  }

  deleteCustomer(customer: Customer): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le client "${customer.firstName} ${customer.lastName}" ?`)) {
      // TODO: Implement customer deletion service
      console.log('Delete customer:', customer);
      alert('Suppression de client non implémentée pour le moment.');
    }
  }

  // Sentiment analysis methods
  loadAllProductsAspectData(): void {
    if (this.allProductsAspectData.length > 0) {
      return; // Data already loaded
    }

    const productIds = this.products.map(p => p.id);
    const requests = productIds.map(id => 
      this.aspectDataService.getAspectData(id)
    );

    forkJoin(requests).subscribe({
      next: (results) => {
        this.allProductsAspectData = results.map((data, index) => ({
          productId: productIds[index],
          data: data
        }));
      },
      error: (err) => {
        console.error('Failed to load aspect data', err);
      }
    });
  }

  getProductAspectData(productId: number): AspectData[] | undefined {
    const found = this.allProductsAspectData.find(item => item.productId === productId);
    return found?.data;
  }

  getSentimentPercentage(productId: number, type: 'positive' | 'negative'): number {
    const data = this.getProductAspectData(productId);
    if (!data || data.length === 0) return 0;

    const total = data.reduce((sum, a) => sum + a.totalMentions, 0);
    if (total === 0) return 0;

    if (type === 'positive') {
      const positives = data.reduce((sum, a) => sum + a.positiveCount, 0);
      return Math.round((positives / total) * 100);
    } else {
      const negatives = data.reduce((sum, a) => sum + a.negativeCount, 0);
      return Math.round((negatives / total) * 100);
    }
  }

  getGlobalPositiveCount(): number {
    return this.allProductsAspectData.reduce((sum, item) => 
      sum + item.data.reduce((s, a) => s + a.positiveCount, 0), 0
    );
  }

  getGlobalNegativeCount(): number {
    return this.allProductsAspectData.reduce((sum, item) => 
      sum + item.data.reduce((s, a) => s + a.negativeCount, 0), 0
    );
  }

  getGlobalTotalCount(): number {
    return this.allProductsAspectData.reduce((sum, item) => 
      sum + item.data.reduce((s, a) => s + a.totalMentions, 0), 0
    );
  }

  getGlobalScore(): number {
    const total = this.getGlobalTotalCount();
    if (total === 0) return 0;
    const positive = this.getGlobalPositiveCount();
    return Math.round((positive / total) * 100);
  }

  // Stats modal methods
  viewProductStats(product: Product): void {
    this.selectedProductForStats = product;
    this.productStatsData = this.getProductAspectData(product.id) || null;
    this.showStatsModal = true;
  }

  closeStatsModal(): void {
    this.showStatsModal = false;
    this.selectedProductForStats = null;
    this.productStatsData = null;
  }

  getProductPositiveScore(): number {
    if (!this.productStatsData || this.productStatsData.length === 0) return 0;
    const total = this.productStatsData.reduce((sum, a) => sum + a.totalMentions, 0);
    if (total === 0) return 0;
    const positive = this.productStatsData.reduce((sum, a) => sum + a.positiveCount, 0);
    return Math.round((positive / total) * 100);
  }

  getProductNegativeScore(): number {
    if (!this.productStatsData || this.productStatsData.length === 0) return 0;
    const total = this.productStatsData.reduce((sum, a) => sum + a.totalMentions, 0);
    if (total === 0) return 0;
    const negative = this.productStatsData.reduce((sum, a) => sum + a.negativeCount, 0);
    return Math.round((negative / total) * 100);
  }
}
