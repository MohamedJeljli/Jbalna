import { Level } from './models';

/** A photo of public/photos, in two sizes. */
export interface Photo {
  src: string; // large, for the hike page
  small: string; // for cards and lists
  alt: string; // also used as the caption
  focus: string; // object-position: the part to keep when the picture is cropped
}

function photo(name: string, alt: string, focus = 'center'): Photo {
  return { src: `/photos/${name}.webp`, small: `/photos/${name}-sm.webp`, alt, focus };
}

interface MountainPhotos {
  photos: Photo[];
  /** Index of the cover photo for a level, when it is not the first photo. */
  covers?: Partial<Record<Level, number>>;
}

// Photos taken during our own hikes, grouped by mountain.
const MOUNTAINS: Record<string, MountainPhotos> = {
  zaghouan: {
    photos: [
      photo('zaghouan-1', 'Sunrise from the ridge of Djebel Zaghouan', 'center 40%'),
      photo('zaghouan-2', 'A break on the way up to the Zaghouan summit', 'center 55%'),
      photo('zaghouan-3', 'At the summit sign of Djebel Zaghouan, 1,295 m', 'center 62%'),
      photo('zaghouan-4', 'The summit sign of Djebel Zaghouan under the clouds', 'center 62%'),
      photo('zaghouan-5', 'The forest track at the start of the Zaghouan trail', 'center 60%'),
      photo('zaghouan-6', 'The slopes of Djebel Zaghouan', 'center 60%'),
    ],
  },
  ressas: {
    photos: [
      photo('ressas-1', 'On the ridge path of Djebel Ressas at sunset', 'center 55%'),
      photo('ressas-2', 'The summit marker of Djebel Ressas at dusk, 795 m', 'center 45%'),
      photo('ressas-3', 'Two hikers at the summit marker of Djebel Ressas', 'center 38%'),
      photo('ressas-4', 'In front of an old mine entrance at the foot of Djebel Ressas', 'center 45%'),
      photo('ressas-5', 'The Ressas summit at night, above the lights of Tunis', 'center 60%'),
      photo('ressas-6', 'Evening light at the top of Djebel Ressas', 'center 45%'),
    ],
    covers: { Easy: 3 },
  },
  bargou: {
    photos: [photo('bargou-1', 'The rock arch above the Bargou valley', 'center 45%')],
  },
  serj: {
    photos: [
      photo('serj-1', 'The ridge of Djebel Serj above the haze', 'center 60%'),
      photo('serj-2', 'Climbing the rocky slope of Djebel Serj', 'center 50%'),
      photo('serj-3', 'A rest on the Serj plateau, above a sea of clouds', 'center 75%'),
    ],
  },
};

/** "Djebel Zaghouan", "Jebel zaghouan" and "Zaghouan" all give "zaghouan". */
function key(mountain: string): string {
  return mountain
    .toLowerCase()
    .replace(/^(djebel|jebel|jbel)\s+/, '')
    .trim();
}

/** Photos of a mountain, the cover for this level first. Empty when we have no photo yet. */
export function photosOf(mountain: string, level?: Level): Photo[] {
  const entry = MOUNTAINS[key(mountain)];
  if (!entry) return [];
  const cover = (level && entry.covers?.[level]) || 0;
  return [entry.photos[cover], ...entry.photos.filter((_, i) => i !== cover)];
}

export function coverOf(mountain: string, level: Level): Photo | null {
  return photosOf(mountain, level)[0] ?? null;
}

export const HERO_PHOTO = '/photos/hero.webp';
export const ABOUT_HERO_PHOTO = '/photos/about-hero.webp';

/** One photo per mountain, for the About page. */
export const ABOUT_PHOTOS: Photo[] = [
  MOUNTAINS['zaghouan'].photos[1],
  MOUNTAINS['ressas'].photos[4],
  MOUNTAINS['serj'].photos[2],
  MOUNTAINS['bargou'].photos[0],
];
