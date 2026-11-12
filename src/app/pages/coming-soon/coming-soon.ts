import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Placeholder for pages of the sitemap that are not built yet. */
@Component({
  selector: 'app-coming-soon',
  imports: [RouterLink],
  template: `
    <section class="container soon">
      <h1>{{ pageTitle() }}</h1>
      <p>This page is on the way. We are building Jbalna one trail at a time.</p>
      <a class="btn btn--outline" routerLink="/">Back to home</a>
    </section>
  `,
  styles: `
    .soon {
      display: grid;
      justify-items: start;
      gap: 16px;
      min-height: 50vh;
      padding-block: 64px;
      align-content: center;
    }
  `,
})
export class ComingSoon {
  // Filled from the route's `data` (withComponentInputBinding)
  readonly pageTitle = input('Coming soon');
}
