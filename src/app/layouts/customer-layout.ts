import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { FirebaseService, CartItem } from '../services/firebase.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-customer-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, FormsModule],
  templateUrl: './customer-layout.html',
  styleUrl: './customer-layout.css'
})
export class CustomerLayout {
  readonly firebaseService = inject(FirebaseService);
  private readonly router = inject(Router);

  readonly showProfileMenu = signal(false);
  readonly showCartDrawer = signal(false);
  readonly checkoutSuccess = signal(false);
  readonly searchTerm = signal('');

  toggleProfileMenu() {
    this.showProfileMenu.update(v => !v);
  }

  toggleCartDrawer() {
    this.showCartDrawer.update(v => !v);
  }

  updateQuantity(itemId: string, qty: number) {
    this.firebaseService.updateQuantity(itemId, qty);
  }

  removeItem(itemId: string) {
    this.firebaseService.removeFromCart(itemId);
  }

  onSearchChange() {
    // Navigate to shop and trigger query param or let shared service handle it.
    this.router.navigate(['/shop'], { queryParams: { search: this.searchTerm() } });
  }

  checkout() {
    this.checkoutSuccess.set(true);
    setTimeout(() => {
      this.firebaseService.clearCart();
      this.checkoutSuccess.set(false);
      this.showCartDrawer.set(false);
    }, 2500);
  }

  logout() {
    this.firebaseService.logout().then(() => {
      this.router.navigate(['/login']);
    });
  }
}
