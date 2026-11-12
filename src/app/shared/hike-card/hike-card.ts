import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Hike } from '../../core/hike';

@Component({
  selector: 'app-hike-card',
  imports: [RouterLink],
  templateUrl: './hike-card.html',
  styleUrl: './hike-card.scss',
})
export class HikeCard {
  readonly hike = input.required<Hike>();
}
