import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { roleGuard } from './core/auth.guard';
import { Home } from './pages/home/home';

// Sitemap of Objective 2. Pages other than Home are loaded on demand (lazy loading)
// to keep the first download small.
export const routes: Routes = [
  { path: '', component: Home, title: 'Jbalna · Find your guide, conquer your mountain' },

  // Public pages
  {
    path: 'explore',
    title: 'Explore hikes · Jbalna',
    loadComponent: () => import('./pages/explore/explore').then((m) => m.Explore),
  },
  {
    path: 'hikes/:id',
    title: 'Hike · Jbalna',
    loadComponent: () => import('./pages/hike-detail/hike-detail').then((m) => m.HikeDetailPage),
  },
  {
    path: 'guides',
    title: 'Guides · Jbalna',
    loadComponent: () => import('./pages/guides/guides').then((m) => m.Guides),
  },
  {
    path: 'guides/:id',
    title: 'Guide profile · Jbalna',
    loadComponent: () => import('./pages/guide-profile/guide-profile').then((m) => m.GuideProfilePage),
  },
  {
    path: 'about',
    title: 'About us · Jbalna',
    loadComponent: () => import('./pages/about/about').then((m) => m.About),
  },
  {
    path: 'contact',
    title: 'Contact · Jbalna',
    loadComponent: () => import('./pages/contact/contact').then((m) => m.Contact),
  },
  {
    path: 'login',
    title: 'Log in · Jbalna',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: 'signup',
    title: 'Sign up · Jbalna',
    loadComponent: () => import('./pages/signup/signup').then((m) => m.Signup),
  },
  {
    path: 'become-a-guide',
    redirectTo: () => inject(Router).createUrlTree(['/signup'], { queryParams: { role: 'guide' } }),
  },

  // Hiker space
  {
    path: 'my-bookings',
    title: 'My bookings · Jbalna',
    canActivate: [roleGuard('hiker')],
    loadComponent: () => import('./pages/my-bookings/my-bookings').then((m) => m.MyBookings),
  },

  // Guide space
  {
    path: 'dashboard',
    title: 'Guide dashboard · Jbalna',
    canActivate: [roleGuard('guide')],
    loadComponent: () => import('./pages/guide-dashboard/guide-dashboard').then((m) => m.GuideDashboardPage),
  },

  {
    path: '**',
    title: 'Page not found · Jbalna',
    loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFound),
  },
];
