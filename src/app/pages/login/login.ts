import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, safeReturnUrl } from '../../core/auth.service';
import { apiMessage } from '../../core/load';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: '../auth-page.scss',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);

  /** ?returnUrl=... : the page that asked for a login (e.g. booking a hike). */
  readonly returnUrl = input<string>();

  protected readonly pending = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.pending.set(true);
    this.error.set(null);

    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: ({ user }) => {
        this.toasts.success(`Welcome back, ${user.name.split(' ')[0]}!`);
        this.router.navigateByUrl(safeReturnUrl(this.returnUrl()) ?? this.auth.homeFor(user.role));
      },
      error: (error) => {
        this.pending.set(false);
        this.error.set(apiMessage(error));
      },
    });
  }

  /** Fills the form with a demo account (handy for the project demo). */
  protected useDemo(email: string): void {
    this.form.setValue({ email, password: 'jbalna123' });
  }
}
