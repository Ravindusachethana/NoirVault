import { Routes } from '@angular/router';
import { Register } from './pages/register/register';
import { Login } from './pages/login/login';
import { CustomerLayout } from './layouts/customer-layout';
import { AdminLayout } from './layouts/admin-layout';
import { Shop } from './pages/shop/shop';
import { Collection } from './pages/collection/collection';
import { LimitedEdition } from './pages/limited-edition/limited-edition';
import { AboutUs } from './pages/about-us/about-us';
import { AdminDashboard } from './pages/admin/dashboard/dashboard';
import { AddProduct } from './pages/admin/add-product/add-product';
import { AddCollection } from './pages/admin/add-collection/add-collection';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  // Authentication routes
  { path: 'register', component: Register },
  { path: 'login', component: Login },

  // Customer routes (Protected by authGuard)
  {
    path: '',
    component: CustomerLayout,
    canActivate: [authGuard],
    children: [
      { path: 'shop', component: Shop },
      { path: 'collection', component: Collection },
      { path: 'limited-edition', component: LimitedEdition },
      { path: 'about-us', component: AboutUs },
      { path: '', redirectTo: 'shop', pathMatch: 'full' }
    ]
  },

  // Admin routes (Protected by authGuard & adminGuard)
  {
    path: 'admin',
    component: AdminLayout,
    canActivate: [authGuard, adminGuard],
    children: [
      { path: 'dashboard', component: AdminDashboard },
      { path: 'add-product', component: AddProduct },
      { path: 'add-limited', component: AddProduct }, // Reuses AddProduct with route detection
      { path: 'add-collection', component: AddCollection },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // Fallback
  { path: '**', redirectTo: 'login' }
];
