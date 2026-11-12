import { Routes } from '@angular/router';
import { ComingSoon } from './pages/coming-soon/coming-soon';
import { Home } from './pages/home/home';

const soon = (path: string, pageTitle: string) => ({
  path,
  component: ComingSoon,
  title: `${pageTitle} · Jbalna`,
  data: { pageTitle },
});

// Public pages of the sitemap. Replace each `soon(...)` with the real page as it is built.
export const routes: Routes = [
  { path: '', component: Home, title: 'Jbalna · Find your guide, conquer your mountain' },
  soon('explore', 'Explore hikes'),
  soon('hikes/:id', 'Hike details'),
  soon('guides', 'Guides'),
  soon('about', 'About us'),
  soon('contact', 'Contact'),
  soon('become-a-guide', 'Become a guide'),
  soon('faq', 'FAQ'),
  soon('login', 'Log in'),
  soon('signup', 'Sign up'),
  { path: '**', redirectTo: '' },
];
