import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { ContactService } from '../../core/contact.service';
import { apiMessage } from '../../core/load';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-contact',
  imports: [ReactiveFormsModule],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export class Contact {
  private readonly service = inject(ContactService);
  private readonly toasts = inject(ToastService);

  protected readonly sending = signal(false);
  protected readonly sent = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly subjects = ['A question about a hike', 'Becoming a guide', 'A problem with my account', 'Something else'];

  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email]],
    subject: [this.subjects[0], Validators.required],
    message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
  });

  constructor() {
    // Logged-in users do not have to type their name and email again.
    const user = inject(AuthService).user();
    if (user) this.form.patchValue({ name: user.name, email: user.email });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.sending.set(true);
    this.error.set(null);
    this.service.send(this.form.getRawValue()).subscribe({
      next: () => {
        this.sending.set(false);
        this.sent.set(true);
        this.toasts.success('Message sent. We answer within two days.');
      },
      error: (error) => {
        this.sending.set(false);
        this.error.set(apiMessage(error));
      },
    });
  }

  protected another(): void {
    this.form.controls.message.reset();
    this.sent.set(false);
  }
}
