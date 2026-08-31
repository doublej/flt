import { env } from '$env/dynamic/private'
import { error } from '@sveltejs/kit'
import Stripe from 'stripe'

/** Built per request, because on Cloudflare the secret only exists once a
 *  request is in flight. The Workers runtime has no Node http stack, so the SDK
 *  gets the fetch client instead; without it every call throws at runtime. */
export function stripeClient(): Stripe {
  if (!env.STRIPE_SECRET_KEY) error(500, 'Payments are not configured on this deployment.')

  return new Stripe(env.STRIPE_SECRET_KEY, {
    httpClient: Stripe.createFetchHttpClient(),
  })
}
