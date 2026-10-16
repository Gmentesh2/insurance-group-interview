import type { Quote } from '@/lib/contracts';

/** Public fictional examples only. No customer identity or purchasable quote IDs. */
export interface HomepageExample {
  days: number;
  startDate: string;
  endDate: string;
  travelerCount: number;
  travelerAge: number;
  residenceCountry: string;
  destinationCountry: string;
  plans: Pick<Quote, 'plan' | 'provider' | 'totalCents' | 'currency' | 'coverage' | 'exclusions'>[];
}
