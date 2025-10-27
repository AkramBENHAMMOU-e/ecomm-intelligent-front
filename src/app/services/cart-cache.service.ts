import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, distinctUntilChanged, map } from 'rxjs';
import { Cart } from '../models/cart.model';

@Injectable({
  providedIn: 'root'
})
export class CartCacheService {
  private cartCache = new BehaviorSubject<Cart | null>(null);
  private lastUpdateTime = 0;
  private readonly CACHE_DURATION = 5000; // 5 secondes

  // Observable pour écouter les changements du panier avec distinctUntilChanged
  cart$ = this.cartCache.asObservable().pipe(
    distinctUntilChanged((prev, curr) => {
      // Comparer seulement les propriétés importantes
      if (!prev && !curr) return true;
      if (!prev || !curr) return false;
      
      return prev.id === curr.id && 
             prev.items?.length === curr.items?.length &&
             JSON.stringify(prev.items?.map(item => ({ id: item.id, quantity: item.quantity }))) === 
             JSON.stringify(curr.items?.map(item => ({ id: item.id, quantity: item.quantity })));
    })
  );

  // Obtenir le panier actuel depuis le cache
  getCurrentCart(): Cart | null {
    return this.cartCache.value;
  }

  // Mettre à jour le cache du panier seulement si nécessaire
  updateCart(cart: Cart | null): void {
    const currentCart = this.cartCache.value;
    
    // Vérifier si le panier a vraiment changé
    if (this.hasCartChanged(currentCart, cart)) {
      this.cartCache.next(cart);
      this.lastUpdateTime = Date.now();
      console.log('📦 Cache du panier mis à jour (changement détecté)');
    } else {
      console.log('📦 Cache du panier inchangé (pas de mise à jour nécessaire)');
    }
  }

  // Vérifier si le panier a changé
  private hasCartChanged(oldCart: Cart | null, newCart: Cart | null): boolean {
    if (!oldCart && !newCart) return false;
    if (!oldCart || !newCart) return true;
    
    if (oldCart.id !== newCart.id) return true;
    if (oldCart.items?.length !== newCart.items?.length) return true;
    
    // Comparer les items
    if (oldCart.items && newCart.items) {
      for (let i = 0; i < oldCart.items.length; i++) {
        const oldItem = oldCart.items[i];
        const newItem = newCart.items[i];
        
        if (!newItem || 
            oldItem.id !== newItem.id || 
            oldItem.quantity !== newItem.quantity ||
            oldItem.product?.id !== newItem.product?.id) {
          return true;
        }
      }
    }
    
    return false;
  }

  // Vérifier si le cache est encore valide
  isCacheValid(): boolean {
    return Date.now() - this.lastUpdateTime < this.CACHE_DURATION;
  }

  // Vider le cache
  clearCache(): void {
    this.cartCache.next(null);
    this.lastUpdateTime = 0;
  }

  // Obtenir le nombre d'articles dans le panier
  getCartItemsCount(): number {
    const cart = this.getCurrentCart();
    return cart?.items?.length || 0;
  }

  // Obtenir le total du panier
  getCartTotal(): number {
    const cart = this.getCurrentCart();
    if (!cart?.items) return 0;
    return cart.items.reduce((sum, item) => sum + (item.product?.price || 0) * (item.quantity || 0), 0);
  }
}
