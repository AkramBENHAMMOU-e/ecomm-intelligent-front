import { Component, OnInit } from '@angular/core';
import { Customer } from '../../models/order.model';
import { CustomerService } from '../../services/customer.service';

@Component({
  selector: 'app-customer-management',
  standalone: false,
  templateUrl: './customer-management.html',
  styleUrl: './customer-management.css'
})
export class CustomerManagementComponent implements OnInit {
  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  loading = false;
  error: string | null = null;
  searchTerm: string = '';
  sortBy: string = 'firstName';
  sortOrder: 'asc' | 'desc' = 'asc';

  constructor(private customerService: CustomerService) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.loading = true;
    this.error = null;
    this.customerService.getAllCustomers().subscribe({
      next: (customers) => {
        this.customers = customers;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading customers:', err);
        this.error = 'Erreur lors du chargement des clients';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.customers];

    // Search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(customer => 
        customer.firstName.toLowerCase().includes(term) ||
        customer.lastName.toLowerCase().includes(term) ||
        customer.email.toLowerCase().includes(term) ||
        customer.phone.includes(term)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (this.sortBy) {
        case 'firstName':
          aValue = a.firstName;
          bValue = b.firstName;
          break;
        case 'lastName':
          aValue = a.lastName;
          bValue = b.lastName;
          break;
        case 'email':
          aValue = a.email;
          bValue = b.email;
          break;
        case 'phone':
          aValue = a.phone;
          bValue = b.phone;
          break;
        default:
          aValue = a.firstName;
          bValue = b.firstName;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return this.sortOrder === 'asc' ? comparison : -comparison;
      }
      return 0;
    });

    this.filteredCustomers = filtered;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onSortChange(field: string): void {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortOrder = 'asc';
    }
    this.applyFilters();
  }

  getSortIcon(field: string): string {
    if (this.sortBy !== field) return '↕️';
    return this.sortOrder === 'asc' ? '↑' : '↓';
  }

  getCustomerFullName(customer: Customer): string {
    return `${customer.firstName} ${customer.lastName}`;
  }

  getCustomerOrdersCount(customer: Customer): number {
    return customer.orders ? customer.orders.length : 0;
  }

  viewCustomerDetails(customer: Customer): void {
    // For now, just show an alert with customer details
    // In a real application, you might want to open a modal or navigate to a detail page
    const details = `
      Client: ${this.getCustomerFullName(customer)}
      Email: ${customer.email || 'Non renseigné'}
      Téléphone: ${customer.phone || 'Non renseigné'}
      Adresse: ${customer.address || 'Non renseignée'}
      Nombre de commandes: ${this.getCustomerOrdersCount(customer)}
    `;
    alert(details);
  }
}
