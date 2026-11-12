import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, safeReturnUrl } from '../../core/auth.service';
import { apiMessage } from '../../core/load';
import { Role } from '../../core/models';
import { ToastService } from '../../core/toast.service';

/** Sign up (wireframe 5/5): the role chosen here sets the account type, then three fields only. */
@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: '../auth-page.scss',
})
export class Signup implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);

  /** ?role=guide preselects the guide account ("Become a guide" link). */
  readonly role = input<string>();
  readonly returnUrl = input<string>();

  protected readonly pending = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    role: ['hiker' as Role, Validators.required],
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
  });

  ngOnInit(): void {
    if (this.role() === 'guide') this.form.controls.role.setValue('guide');
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.pending.set(true);
    this.error.set(null);

    this.auth.register(this.form.getRawValue()).subscribe({
      next: ({ user }) => {
        this.toasts.success(`Welcome to Jbalna, ${user.name.split(' ')[0]}!`);
        this.router.navigateByUrl(safeReturnUrl(this.returnUrl()) ?? this.auth.homeFor(user.role));
      },
      error: (error) => {
        this.pending.set(false);
        this.error.set(apiMessage(error));
      },
    });
  }
}
