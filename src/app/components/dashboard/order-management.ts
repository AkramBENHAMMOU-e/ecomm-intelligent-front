import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Order, StatusOrder } from '../../models/order.model';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-order-management',
  standalone: false,
  templateUrl: './order-management.html',
  styleUrl: './order-management.css'
})
export class OrderManagement implements OnInit {
  orders: Order[] = [];
  loading = false;
  error: string | null = null;
  // Add a property to track which order is being edited
  editingOrderId: number | null = null;
  // Add a property to store the new status when editing
  newStatus: StatusOrder = 'Processing';

  constructor(
    private orderService: OrderService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;
    this.error = null;
    this.orderService.getOrders().subscribe({
      next: (data) => {
        this.orders = data ?? [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load orders', err);
        this.error = 'Impossible de charger les commandes';
        this.loading = false;
      }
    });
  }

  refreshOrders(): void {
    this.loadOrders();
  }

  getOrderTotal(order: Order): number {
    return order.items.reduce((total, item) => total + (item.price * item.quantity), 0);
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
    // For now, we'll just show an alert with order details
    // In a more complete implementation, this would navigate to an order details page
    alert(`Commande #${order.id}
Statut: ${order.status}
Date: ${order.date}
Total: ${this.getOrderTotal(order)} DH
Articles: ${order.items.length}`);
  }

  // Method to start editing an order's status
  startEditing(order: Order): void {
    this.editingOrderId = order.id!;
    this.newStatus = order.status || 'Processing';
  }

  // Method to cancel editing
  cancelEditing(): void {
    this.editingOrderId = null;
  }

  // Method to save the updated status
  saveStatus(order: Order): void {
    if (!this.editingOrderId) return;

    const updatedOrder = { ...order, status: this.newStatus };

    this.orderService.updateOrder(this.editingOrderId, updatedOrder).subscribe({
      next: (updatedOrder) => {
        console.log('Order updated successfully:', updatedOrder);
        // Update the order in the local array
        const index = this.orders.findIndex(o => o.id === this.editingOrderId);
        if (index !== -1) {
          this.orders[index] = updatedOrder;
        }
        // Exit editing mode
        this.editingOrderId = null;
      },
      error: (err) => {
        console.error('Failed to update order', err);
        alert('Impossible de mettre à jour la commande. Veuillez réessayer.');
      }
    });
  }

  deleteOrder(order: Order): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la commande #${order.id} ?`)) {
      this.orderService.deleteOrder(order.id!).subscribe({
        next: () => {
          console.log('Order deleted successfully:', order.id);
          // Remove the deleted order from the local array
          this.orders = this.orders.filter(o => o.id !== order.id);
        },
        error: (err) => {
          console.error('Failed to delete order', err);
          alert('Impossible de supprimer la commande. Veuillez réessayer.');
        }
      });
    }
  }
}
