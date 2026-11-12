import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <section class="container page lost">
      <p class="eyebrow">Error 404</p>
      <h1>This trail does not exist.</h1>
      <p>The page may have moved, or the link is wrong.</p>
      <div class="lost__actions">
        <a class="btn btn--primary" routerLink="/">Back to home</a>
        <a class="btn btn--outline" routerLink="/explore">Explore hikes</a>
      </div>
    </section>
  `,
  styles: `
    .lost { display: grid; justify-items: start; gap: 14px; min-height: 50vh; align-content: center; }
    .lost__actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 8px; }
  `,
})
export class NotFound {}
