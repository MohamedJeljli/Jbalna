import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);
  protected readonly auth = inject(AuthService);
  protected readonly menuOpen = signal(false);

  /** Main menu, plus the personal space of the logged-in user. */
  protected readonly links = computed(() => {
    const links = [
      { path: '/explore', label: 'Explore' },
      { path: '/guides', label: 'Guides' },
      { path: '/about', label: 'About' },
    ];
    const role = this.auth.user()?.role;
    if (role === 'hiker') links.push({ path: '/my-bookings', label: 'My bookings' });
    if (role === 'guide') links.push({ path: '/dashboard', label: 'Dashboard' });
    return links;
  });

  protected readonly firstName = computed(() => this.auth.user()?.name.split(' ')[0] ?? '');

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected logout(): void {
    this.auth.logout();
    this.toasts.success('You are logged out. See you on the trail!');
    this.router.navigateByUrl('/');
  }
}
