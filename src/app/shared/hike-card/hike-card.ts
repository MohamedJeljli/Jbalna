import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Hike } from '../../core/models';
import { HikePhoto } from '../hike-photo/hike-photo';

@Component({
  selector: 'app-hike-card',
  imports: [RouterLink, DatePipe, HikePhoto],
  templateUrl: './hike-card.html',
  styleUrl: './hike-card.scss',
})
export class HikeCard {
  readonly hike = input.required<Hike>();
}
