import Stripe from 'stripe';
import { env } from './env';

let _stripe: Stripe | null = null;

/** Lazy-initialized Stripe client (avoids build-time crash when env var is empty) */
export function getStripe(): Stripe {
  if (!_stripe) {
    if (!env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    _stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-01-28.clover',
      typescript: true,
    });
  }
  return _stripe;
}

/** Cents → display string ($12.50) */
export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
