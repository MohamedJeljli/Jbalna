// Shapes of the JSON returned by the Jbalna API (see server/src/api).

export type Level = 'Easy' | 'Medium' | 'Hard';
export const LEVELS: readonly Level[] = ['Easy', 'Medium', 'Hard'];

export type Role = 'hiker' | 'guide' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface Session {
  token: string;
  user: User;
}

export interface RouteInfo {
  id: number;
  title: string;
  mountain: string;
  region: string;
  level: Level;
  description: string;
  distanceKm: number;
  elevationM: number;
  durationHours: number;
}

export interface GuideSummary {
  id: number;
  name: string;
  verified: boolean;
  rating: number | null;
  reviewCount: number;
}

/** A dated hike on a route, as listed on Explore, Home and the profiles. */
export interface Hike {
  id: number;
  date: string; // YYYY-MM-DD
  priceDt: number;
  spots: number;
  booked: number;
  spotsLeft: number;
  meetingPoint: string;
  status: 'open' | 'cancelled';
  isPast: boolean;
  route: RouteInfo;
  guide: GuideSummary;
}

export interface HikeDate {
  id: number;
  date: string;
  priceDt: number;
  spotsLeft: number;
}

export interface HikeDetail extends Omit<Hike, 'guide'> {
  guide: GuideSummary & { bio: string | null; languages: string | null; experienceYears: number | null };
  /** Upcoming open dates of the same route (the hike itself included when it is upcoming). */
  dates: HikeDate[];
}

export interface HikeFilters {
  q?: string;
  mountain?: string;
  level?: string;
  date?: string;
  maxPrice?: string;
  sort?: string;
  limit?: string;
}

export interface Guide {
  id: number;
  name: string;
  bio: string;
  region: string;
  languages: string[];
  experienceYears: number;
  verified: boolean;
  rating: number | null;
  reviewCount: number;
  upcomingHikes: number;
}

export interface Review {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
  hikerName: string;
  routeTitle: string;
}

export interface GuideProfile extends Guide {
  hikes: Hike[];
  reviews: Review[];
}

export interface GuideDashboard {
  guide: Guide;
  stats: { upcomingHikes: number; bookedSpots: number; rating: number | null };
  upcoming: Hike[];
  reviews: Review[];
}

export interface Participant {
  id: number;
  name: string;
  email: string;
  spots: number;
  bookedAt: string;
}

/** A route (trail) owned by the logged-in guide. */
export interface MyRoute extends RouteInfo {
  upcomingHikes: number;
}

export interface Booking {
  id: number;
  spots: number;
  status: 'confirmed' | 'cancelled';
  bookedAt: string;
  hikeId: number;
  date: string;
  priceDt: number;
  meetingPoint: string;
  isPast: boolean;
  title: string;
  mountain: string;
  level: Level;
  durationHours: number;
  guideId: number;
  guideName: string;
  reviewRating: number | null;
}
