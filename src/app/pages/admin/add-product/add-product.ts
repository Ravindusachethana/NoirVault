import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FirebaseService } from '../../../services/firebase.service';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';

@Component({
  selector: 'app-admin-add-product',
  imports: [CommonModule, FormsModule],
  templateUrl: './add-product.html',
  styleUrl: './add-product.css'
})
export class AddProduct implements OnInit {
  private readonly firebaseService = inject(FirebaseService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Form inputs
  name = '';
  price: number | null = null;
  category = 'Woody';
  notes = '';
  imageUrl = '';
  description = '';
  limitedEdition = false;

  // View settings
  isLimitedPage = signal(false);
  submitting = signal(false);
  errorMessage = signal<string | null>(null);

  ngOnInit() {
    // Detect if we accessed via add-limited route
    this.route.url.subscribe(urlSegments => {
      const path = urlSegments.map(segment => segment.path).join('/');
      if (path.includes('add-limited')) {
        this.isLimitedPage.set(true);
        this.limitedEdition = true;
      }
    });
  }

  onSubmit(form: NgForm) {
    if (form.invalid) {
      this.errorMessage.set('Please fill out all required fields with valid details.');
      return;
    }

    if (!this.price || this.price <= 0) {
      this.errorMessage.set('Price must be greater than zero.');
      return;
    }

    this.errorMessage.set(null);
    this.submitting.set(true);

    const productData = {
      name: this.name,
      price: this.price,
      category: this.category,
      notes: this.notes,
      imageUrl: this.imageUrl,
      description: this.description,
      limitedEdition: this.limitedEdition
    };

    this.firebaseService.addProduct(productData)
      .then(() => {
        this.submitting.set(false);
        this.router.navigate(['/admin/dashboard']);
      })
      .catch((err: Error) => {
        this.submitting.set(false);
        this.errorMessage.set(err.message || 'Failed to save product in database.');
      });
  }

  cancel() {
    this.router.navigate(['/admin/dashboard']);
  }
}
