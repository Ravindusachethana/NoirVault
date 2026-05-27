import { Component, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FirebaseService, Product } from '../../../services/firebase.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class AdminDashboard {
  readonly firebaseService = inject(FirebaseService);
  private readonly route = inject(ActivatedRoute);

  // Stats computed from signals
  readonly totalProducts = computed(() => this.firebaseService.products().length);
  readonly totalLimited = computed(() => this.firebaseService.products().filter(p => p.limitedEdition).length);
  readonly totalCollections = computed(() => this.firebaseService.collections().length);

  // Search Filter
  readonly currentSearch = signal<string>('');

  // Editing States
  readonly editingProduct = signal<Product | null>(null);

  constructor() {
    this.route.queryParams.subscribe(params => {
      if (params['search'] !== undefined) {
        this.currentSearch.set(params['search']);
      }
    });
  }

  getFilteredProducts(): Product[] {
    let list = this.firebaseService.products();
    const query = this.currentSearch().toLowerCase().trim();
    if (query) {
      list = list.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.notes.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      );
    }
    return list;
  }

  deleteProduct(id: string) {
    if (confirm('Are you sure you want to remove this fragrance from the atelier database?')) {
      this.firebaseService.deleteProduct(id);
    }
  }

  startEdit(product: Product) {
    // Create a deep copy of the product to edit
    this.editingProduct.set({ ...product });
  }

  cancelEdit() {
    this.editingProduct.set(null);
  }

  saveEdit() {
    const editVal = this.editingProduct();
    if (editVal) {
      const { id, ...data } = editVal;
      this.firebaseService.editProduct(id, data).then(() => {
        this.editingProduct.set(null);
      });
    }
  }
}
