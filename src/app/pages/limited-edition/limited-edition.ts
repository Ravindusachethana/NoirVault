import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { FirebaseService, Product } from '../../services/firebase.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-limited-edition',
  imports: [CommonModule],
  templateUrl: './limited-edition.html',
  styleUrl: './limited-edition.css'
})
export class LimitedEdition implements OnInit, OnDestroy {
  readonly firebaseService = inject(FirebaseService);

  // Countdown values
  readonly hours = signal('08');
  readonly minutes = signal('42');
  readonly seconds = signal('19');
  private timerInterval: any;

  ngOnInit() {
    this.startCountdown();
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  private startCountdown() {
    // Set a countdown target to 12 hours from now, and decrement every second
    let targetSeconds = 12 * 60 * 60 + 42 * 60 + 19;
    
    this.timerInterval = setInterval(() => {
      if (targetSeconds <= 0) {
        targetSeconds = 12 * 60 * 60; // Reset for continuous demo visual
      } else {
        targetSeconds--;
      }

      const h = Math.floor(targetSeconds / 3600);
      const m = Math.floor((targetSeconds % 3600) / 60);
      const s = targetSeconds % 60;

      this.hours.set(h.toString().padStart(2, '0'));
      this.minutes.set(m.toString().padStart(2, '0'));
      this.seconds.set(s.toString().padStart(2, '0'));
    }, 1000);
  }

  getLimitedProducts(): Product[] {
    return this.firebaseService.products().filter(p => p.limitedEdition);
  }

  addToCart(product: Product) {
    this.firebaseService.addToCart(product, 1);
  }
}
