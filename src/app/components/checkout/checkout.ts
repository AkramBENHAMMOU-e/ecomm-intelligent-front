import { Component } from '@angular/core';
import { Order } from '../../models/order.model';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-checkout',
  standalone: false,
  templateUrl: './checkout.html',
  styleUrl: './checkout.css'
})
export class CheckoutComponent {
  cartIdInput: string = '';
  loading = false;
  error: string | null = null;
  order: Order | null = null;

  // Simple customer info (stored locally for UX only)
  name: string = '';
  email: string = '';
  address: string = '';

  constructor(private orderService: OrderService) {
    const saved = localStorage.getItem('cartId');
    if (saved) this.cartIdInput = saved;

    const info = localStorage.getItem('checkoutInfo');
    if (info) {
      try {
        const parsed = JSON.parse(info);
        this.name = parsed.name || '';
        this.email = parsed.email || '';
        this.address = parsed.address || '';
      } catch {}
    }
  }

  placeOrder(): void {
    this.error = null;
    this.order = null;
    const id = Number(this.cartIdInput);
    if (!id || Number.isNaN(id)) {
      this.error = 'Veuillez saisir un ID de panier valide.';
      return;
    }

    // Persist the info locally (backend might not accept it yet)
    localStorage.setItem('checkoutInfo', JSON.stringify({ name: this.name, email: this.email, address: this.address }));

    this.loading = true;
    this.orderService.checkout(id).subscribe({
      next: (ord) => {
        this.order = ord;
        this.loading = false;
        // Clear cartId because backend empties the cart
        localStorage.removeItem('cartId');
      },
      error: (err) => {
        console.error('Checkout failed', err);
        this.loading = false;
        if (err?.status === 404) this.error = 'Panier introuvable.';
        else if (err?.status === 400) this.error = 'Le panier est vide.';
        else this.error = 'Échec du passage de la commande.';
      }
    });
  }

  get totalAmount(): number {
    if (!this.order?.items) return 0;
    return this.order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  }
}
