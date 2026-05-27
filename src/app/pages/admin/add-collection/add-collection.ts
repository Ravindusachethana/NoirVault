import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseService } from '../../../services/firebase.service';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';

@Component({
  selector: 'app-admin-add-collection',
  imports: [CommonModule, FormsModule],
  templateUrl: './add-collection.html',
  styleUrl: './add-collection.css'
})
export class AddCollection {
  private readonly firebaseService = inject(FirebaseService);
  private readonly router = inject(Router);

  // Form Fields
  name = '';
  imageUrl = '';
  description = '';

  submitting = signal(false);
  errorMessage = signal<string | null>(null);

  onSubmit(form: NgForm) {
    if (form.invalid) {
      this.errorMessage.set('Please fill out all required fields with valid details.');
      return;
    }

    this.errorMessage.set(null);
    this.submitting.set(true);

    const collectionData = {
      name: this.name,
      imageUrl: this.imageUrl,
      description: this.description
    };

    this.firebaseService.addCollection(collectionData)
      .then(() => {
        this.submitting.set(false);
        this.router.navigate(['/admin/dashboard']);
      })
      .catch((err: Error) => {
        this.submitting.set(false);
        this.errorMessage.set(err.message || 'Failed to save collection in database.');
      });
  }

  cancel() {
    this.router.navigate(['/admin/dashboard']);
  }
}
