import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Hike } from '../../core/models';
import { MountainArt } from '../mountain-art/mountain-art';

@Component({
  selector: 'app-hike-card',
  imports: [RouterLink, DatePipe, MountainArt],
  templateUrl: './hike-card.html',
  styleUrl: './hike-card.scss',
})
export class HikeCard {
  readonly hike = input.required<Hike>();
}
