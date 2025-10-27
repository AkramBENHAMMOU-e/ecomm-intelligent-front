import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { CartCacheService } from './cart-cache.service';

@Injectable({
  providedIn: 'root'
})
export class CartNotificationService {
  private cartUpdatedSubject = new Subject<{cart: any, action: string}>();
  
  // Observable pour écouter les mises à jour du panier
  cartUpdated$ = this.cartUpdatedSubject.asObservable();
  
  constructor(private cartCacheService: CartCacheService) {}
  
  // Méthode pour notifier qu'un produit a été ajouté au panier
  notifyCartUpdated(cart: any, action: string = 'add'): void {
    // Mettre à jour le cache avec le nouveau panier
    this.cartCacheService.updateCart(cart);
    
    // Notifier les composants
    this.cartUpdatedSubject.next({ cart, action });
  }
}
