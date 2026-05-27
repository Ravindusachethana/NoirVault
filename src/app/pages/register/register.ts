import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  private readonly firebaseService = inject(FirebaseService);
  private readonly router = inject(Router);

  // Form Fields
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  role: 'admin' | 'customer' = 'customer';

  // UI state
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  submitting = signal(false);

  onSubmit(form: NgForm) {
    if (form.invalid) {
      this.errorMessage.set('Please check your details and try again.');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage.set('Passwords do not match.');
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage.set('Password must be at least 6 characters long.');
      return;
    }

    this.errorMessage.set(null);
    this.submitting.set(true);

    this.firebaseService.register(this.email, this.password, this.name, this.role)
      .then(() => {
        this.successMessage.set('Registration successful! Redirecting to login...');
        this.submitting.set(false);
        form.resetForm({ role: 'customer' });
        setTimeout(() => {
          this.successMessage.set(null);
          this.router.navigate(['/login']);
        }, 1500);
      })
      .catch((err: Error) => {
        this.submitting.set(false);
        this.errorMessage.set(err.message || 'An error occurred during registration.');
      });
  }
}
