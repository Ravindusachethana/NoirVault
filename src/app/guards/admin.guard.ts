import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseService } from '../services/firebase.service';

export const adminGuard = () => {
  const firebaseService = inject(FirebaseService);
  const router = inject(Router);
  const user = firebaseService.currentUser();

  if (user && user.role === 'admin') {
    return true;
  }

  if (user) {
    return router.createUrlTree(['/shop']);
  }

  return router.createUrlTree(['/login']);
};
