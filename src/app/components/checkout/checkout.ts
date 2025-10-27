import { Component } from '@angular/core';
import { Order, CheckoutRequest } from '../../models/order.model';
import { OrderService } from '../../services/order.service';
import { CartService } from '../../services/cart.service';
import { CartCacheService } from '../../services/cart-cache.service';
import { Cart } from '../../models/cart.model';

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
  cart: Cart | null = null;
  showEmailConfirm = false;

  // Customer info (stored locally for UX only)
  firstName: string = '';
  lastName: string = '';
  email: string = '';
  address: string = '';
  phoneNumber: string = '';

  constructor(
    private orderService: OrderService,
    private cartService: CartService,
    private cartCacheService: CartCacheService
  ) {
    const saved = localStorage.getItem('cartId');
    if (saved) this.cartIdInput = saved;

    const info = localStorage.getItem('checkoutInfo');
    if (info) {
      try {
        const parsed = JSON.parse(info);
        this.firstName = parsed.firstName || '';
        this.lastName = parsed.lastName || '';
        this.email = parsed.email || '';
        this.address = parsed.address || '';
        this.phoneNumber = parsed.phoneNumber || '';
      } catch {}
    }

    // Load cart
    this.loadCart();
  }

  loadCart(): void {
    const cartId = localStorage.getItem('cartId');
    if (cartId && !isNaN(Number(cartId))) {
      this.cartService.getCartById(Number(cartId)).subscribe({
        next: (cart) => {
          this.cart = cart;
        },
        error: (err) => {
          console.error('Failed to load cart', err);
        }
      });
    }
  }

  get totalPrice(): number {
    if (!this.cart?.items) return 0;
    return this.cart.items.reduce((sum, item) => sum + (item.product?.price || 0) * (item.quantity || 0), 0);
  }

  placeOrder(): void {
    this.error = null;
    this.order = null;
    
    // Validation des champs requis
    if (!this.firstName.trim()) {
      this.error = 'Le prénom est requis.';
      return;
    }
    if (!this.lastName.trim()) {
      this.error = 'Le nom est requis.';
      return;
    }
    if (!this.email.trim()) {
      this.error = 'L\'email est requis pour la confirmation de commande.';
      return;
    }
    if (!this.address.trim()) {
      this.error = 'L\'adresse de livraison est requise.';
      return;
    }
    if (!this.phoneNumber.trim()) {
      this.error = 'Le numéro de téléphone est requis.';
      return;
    }

    // Open email confirmation dialog
    this.showEmailConfirm = true;
  }

  confirmOrder(): void {
    const cartId = localStorage.getItem('cartId');
    if (!cartId || isNaN(Number(cartId))) {
      this.error = 'Panier introuvable.';
      this.showEmailConfirm = false;
      return;
    }

    // Persist the info locally
    localStorage.setItem('checkoutInfo', JSON.stringify({ 
      firstName: this.firstName, 
      lastName: this.lastName,
      email: this.email, 
      address: this.address, 
      phoneNumber: this.phoneNumber 
    }));

    // Create checkout request
    const checkoutRequest: CheckoutRequest = {
      cartId: Number(cartId),
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      phone: this.phoneNumber,
      address: this.address
    };

    this.loading = true;
    this.showEmailConfirm = false;

    this.orderService.checkout(checkoutRequest).subscribe({
      next: (ord) => {
        this.order = ord;
        this.loading = false;
        // Clear cartId because backend empties the cart
        localStorage.removeItem('cartId');
        // Scroll to order summary
        setTimeout(() => {
          const orderSummary = document.querySelector('.order-summary');
          if (orderSummary) {
            orderSummary.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      },
      error: (err) => {
        console.error('Checkout failed', err);
        this.loading = false;
        if (err?.status === 404) this.error = 'Panier introuvable.';
        else if (err?.status === 400) this.error = 'Le panier est vide ou l\'email est requis.';
        else this.error = 'Échec du passage de la commande.';
      }
    });
  }

  cancelOrder(): void {
    this.showEmailConfirm = false;
  }

  get totalAmount(): number {
    if (!this.order?.items) return 0;
    return this.order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  }
}
