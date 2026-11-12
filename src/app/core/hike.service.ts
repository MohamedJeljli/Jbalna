import { Injectable, signal } from '@angular/core';
import { Hike } from './hike';

// Sample content from the Objective 2 mockup. Replace with calls to the REST API
// (GET /hikes?popular=true) once the back-end exists.
const SAMPLE_HIKES: Hike[] = [
  {
    id: 1,
    mountain: 'Djebel Zaghouan',
    level: 'Medium',
    durationHours: 5,
    priceDt: 45,
    art: { sky: '#e9c77b', ridge: '#2c463a', front: '#17261f', sunX: 236 },
  },
  {
    id: 2,
    mountain: 'Djebel Ressas',
    level: 'Hard',
    durationHours: 6,
    priceDt: 55,
    art: { sky: '#d59a72', ridge: '#7c3524', front: '#17261f', sunX: 62 },
  },
  {
    id: 3,
    mountain: 'Djebel Bargou',
    level: 'Easy',
    durationHours: 3,
    priceDt: 35,
    art: { sky: '#bcd2c2', ridge: '#2e6b4a', front: '#17261f', sunX: 240 },
  },
];

@Injectable({ providedIn: 'root' })
export class HikeService {
  readonly popular = signal<Hike[]>(SAMPLE_HIKES).asReadonly();
}
