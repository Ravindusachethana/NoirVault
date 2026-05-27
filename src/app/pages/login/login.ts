import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  readonly firebaseService = inject(FirebaseService);
  private readonly router = inject(Router);

  email = '';
  password = '';

  errorMessage = signal<string | null>(null);
  submitting = signal(false);

  onSubmit(form: NgForm) {
    if (form.invalid) {
      this.errorMessage.set('Please fill out both email and password.');
      return;
    }

    this.errorMessage.set(null);
    this.submitting.set(true);

    this.firebaseService.login(this.email, this.password)
      .then((userSession) => {
        this.submitting.set(false);
        if (userSession.role === 'admin') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/shop']);
        }
      })
      .catch((err: Error) => {
        this.submitting.set(false);
        this.errorMessage.set(err.message || 'Incorrect email or password.');
      });
  }
}
