import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  protected readonly year = new Date().getFullYear();

  protected readonly links: { path: string; label: string; fragment?: string }[] = [
    { path: '/about', label: 'About' },
    { path: '/contact', label: 'Contact' },
    { path: '/become-a-guide', label: 'Become a guide' },
    { path: '/about', label: 'FAQ', fragment: 'faq' },
  ];

  // Only English exists for now; French and Arabic (RTL) come with the translations.
  protected readonly languages = [
    { code: 'EN', name: 'English', available: true },
    { code: 'FR', name: 'Français', available: false },
    { code: 'AR', name: 'العربية', available: false },
  ];
}
