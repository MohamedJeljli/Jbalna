import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ABOUT_HERO_PHOTO, ABOUT_PHOTOS } from '../../core/photos';

@Component({
  selector: 'app-about',
  imports: [RouterLink],
  templateUrl: './about.html',
  styleUrl: './about.scss',
})
export class About {
  protected readonly heroPhoto = ABOUT_HERO_PHOTO;
  protected readonly photos = ABOUT_PHOTOS;

  protected readonly faq = [
    {
      q: 'How do I pay for a hike?',
      a: 'For now you pay the guide on the day, in cash. Booking on Jbalna reserves your spot; online payment will come later.',
    },
    {
      q: 'Can I cancel a booking?',
      a: 'Yes, from My bookings, at any time before the day of the hike. Your spots go back to other hikers.',
    },
    {
      q: 'What does "Verified guide" mean?',
      a: 'Our team has checked the guide’s experience and certifications (mountain leader, first aid). Guides waiting for this check show "Verification pending".',
    },
    {
      q: 'How are the levels defined?',
      a: 'Easy: under 4 hours and little climbing, fine for families. Medium: a full day with steady climbs. Hard: long days, steep or rocky ground, good fitness needed.',
    },
    {
      q: 'I am a guide. How do I publish my hikes?',
      a: 'Create a guide account, add your routes (trail, distance, level) from your dashboard, then publish dates with a price and a number of spots.',
    },
  ];
}
