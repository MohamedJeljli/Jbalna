import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { GuideService } from '../../core/guide.service';
import { LOADING, load } from '../../core/load';
import { Stars } from '../../shared/stars/stars';

/** All guides, with a language filter (the tourist journey of the 3-click rule). */
@Component({
  selector: 'app-guides',
  imports: [RouterLink, Stars],
  templateUrl: './guides.html',
  styleUrl: './guides.scss',
})
export class Guides {
  protected readonly state = toSignal(load(inject(GuideService).list()), { initialValue: LOADING });
  protected readonly language = signal('');

  protected readonly languages = computed(() =>
    [...new Set((this.state().data ?? []).flatMap((guide) => guide.languages))].sort(),
  );

  protected readonly guides = computed(() => {
    const language = this.language();
    const guides = this.state().data ?? [];
    return language ? guides.filter((guide) => guide.languages.includes(language)) : guides;
  });

  protected onLanguage(event: Event): void {
    this.language.set((event.target as HTMLSelectElement).value);
  }
}
