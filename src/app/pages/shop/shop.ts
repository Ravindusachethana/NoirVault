import { Component, inject, signal, effect } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FirebaseService, Product } from '../../services/firebase.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-shop',
  imports: [CommonModule, FormsModule],
  templateUrl: './shop.html',
  styleUrl: './shop.css'
})
export class Shop {
  readonly firebaseService = inject(FirebaseService);
  private readonly route = inject(ActivatedRoute);

  // Filter States
  readonly activeCategory = signal<string>('All');
  readonly currentSearch = signal<string>('');
  readonly sortBy = signal<string>('default');
  
  // Selected Product for Quick View Modal
  readonly selectedProduct = signal<Product | null>(null);

  // Categories list
  categories = ['All', 'Woody', 'Floral', 'Fresh', 'Oriental'];

  constructor() {
    // Listen to query parameters for search terms
    this.route.queryParams.subscribe(params => {
      if (params['search'] !== undefined) {
        this.currentSearch.set(params['search']);
      }
      if (params['category'] !== undefined) {
        this.activeCategory.set(params['category']);
      }
    });
  }

  // Filtered and Sorted products computed list
  getFilteredProducts(): Product[] {
    let list = this.firebaseService.products();

    // Search query filter
    const query = this.currentSearch().toLowerCase().trim();
    if (query) {
      list = list.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.description.toLowerCase().includes(query) ||
        p.notes.toLowerCase().includes(query)
      );
    }

    // Category filter
    const cat = this.activeCategory();
    if (cat !== 'All') {
      list = list.filter(p => p.category.toLowerCase() === cat.toLowerCase());
    }

    // Sorting
    const sortVal = this.sortBy();
    if (sortVal === 'price-low') {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (sortVal === 'price-high') {
      list = [...list].sort((a, b) => b.price - a.price);
    }

    return list;
  }

  setCategory(cat: string) {
    this.activeCategory.set(cat);
  }

  addToCart(product: Product, event: Event) {
    event.stopPropagation(); // Prevent opening modal
    this.firebaseService.addToCart(product, 1);
  }

  openProductDetails(product: Product) {
    this.selectedProduct.set(product);
  }

  closeProductDetails() {
    this.selectedProduct.set(null);
  }

  addSelectedToCart() {
    const prod = this.selectedProduct();
    if (prod) {
      this.firebaseService.addToCart(prod, 1);
      this.closeProductDetails();
    }
  }
}
