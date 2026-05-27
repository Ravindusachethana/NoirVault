import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { FirebaseService } from '../services/firebase.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, FormsModule],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css'
})
export class AdminLayout {
  readonly firebaseService = inject(FirebaseService);
  private readonly router = inject(Router);

  readonly showProfileMenu = signal(false);
  readonly searchTerm = signal('');

  toggleProfileMenu() {
    this.showProfileMenu.update(v => !v);
  }

  onSearchChange() {
    this.router.navigate(['/admin/dashboard'], { queryParams: { search: this.searchTerm() } });
  }

  logout() {
    this.firebaseService.logout().then(() => {
      this.router.navigate(['/login']);
    });
  }
}
