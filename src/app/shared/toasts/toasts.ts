import { Component, inject } from '@angular/core';
import { ToastService } from '../../core/toast.service';

/** Shows the notifications of ToastService; screen readers announce them. */
@Component({
  selector: 'app-toasts',
  template: `
    <div class="toasts" role="status" aria-live="polite">
      @for (toast of toasts.toasts(); track toast.id) {
        <div class="toast" [class.toast--error]="toast.kind === 'error'">
          <span class="toast__icon" aria-hidden="true">{{ toast.kind === 'error' ? '!' : '✓' }}</span>
          <p>{{ toast.message }}</p>
          <button type="button" (click)="toasts.dismiss(toast.id)" aria-label="Close notification">×</button>
        </div>
      }
    </div>
  `,
  styles: `
    .toasts {
      position: fixed; z-index: 50; left: 16px; right: 16px; bottom: 16px;
      display: grid; gap: 8px; justify-items: center; pointer-events: none;
    }
    .toast {
      display: flex; align-items: center; gap: 12px; width: min(100%, 440px);
      padding: 12px 12px 12px 16px; border-radius: var(--radius);
      background: var(--forest); color: var(--sand); box-shadow: var(--shadow-lift);
      pointer-events: auto; animation: rise 0.2s ease-out;
    }
    .toast--error { background: var(--terracotta-dark); color: #fff; }
    .toast p { flex: 1; margin: 0; }
    .toast__icon {
      display: grid; place-items: center; flex: none; width: 24px; height: 24px;
      border-radius: 50%; background: rgb(255 255 255 / 15%); font-weight: 700;
    }
    button {
      flex: none; width: 32px; height: 32px; background: none; border: 0;
      color: inherit; font-size: 22px; line-height: 1; cursor: pointer;
    }
    @keyframes rise { from { opacity: 0; transform: translateY(8px); } }
  `,
})
export class Toasts {
  protected readonly toasts = inject(ToastService);
}
