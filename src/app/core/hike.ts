export type Level = 'Easy' | 'Medium' | 'Hard';

export const LEVELS: readonly Level[] = ['Easy', 'Medium', 'Hard'];

export const MOUNTAINS: readonly string[] = [
  'Djebel Zaghouan',
  'Djebel Ressas',
  'Djebel Bargou',
  'Djebel Serj',
  'Djebel Chambi',
];

/** Colours of the illustrated card image, until guides upload real photos. */
export interface HikeArt {
  sky: string;
  ridge: string;
  front: string;
  sunX: number;
}

export interface Hike {
  id: number;
  mountain: string;
  level: Level;
  durationHours: number;
  priceDt: number;
  art: HikeArt;
}
