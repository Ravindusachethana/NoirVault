import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseService, CollectionType } from '../../services/firebase.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-collection',
  imports: [CommonModule],
  templateUrl: './collection.html',
  styleUrl: './collection.css'
})
export class Collection {
  readonly firebaseService = inject(FirebaseService);
  private readonly router = inject(Router);

  viewCollection(collection: CollectionType) {
    // Map collection selection to corresponding shop categories
    let category = 'All';
    if (collection.name === 'Nocturnal Whispers') {
      category = 'Woody';
    } else if (collection.name === 'Elixir of Light') {
      category = 'Fresh';
    } else if (collection.name === 'Botanical Gardens') {
      category = 'Floral';
    }
    
    this.router.navigate(['/shop'], { queryParams: { category } });
  }
}
