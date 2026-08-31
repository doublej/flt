import { env } from '$env/dynamic/private'
import { stripeClient } from '$lib/server/stripe'
import { error } from '@sveltejs/kit'
import Stripe from 'stripe'
import type { RequestHandler } from './$types'

export const prerender = false

/** Stripe telling us the money arrived. Everything downstream of the signature
 *  check is trusted, so nothing above it may have a side effect.
 *
 *  This endpoint does not fulfil anything, and does not need to: the whole brief
 *  is already in the session's metadata, written there before the customer paid,
 *  and `just pull` reads it back out on the machine that runs the desk. What is
 *  left is an audit line and a 200 — kept rather than deleted, because deleting
 *  the route makes Stripe retry it and then alert on a failing endpoint. */
export const POST: RequestHandler = async ({ request }) => {
  if (!env.STRIPE_WEBHOOK_SECRET) error(500, 'Payments are not configured on this deployment.')

  const signature = request.headers.get('stripe-signature')
  if (!signature) error(400, 'No signature.')

  const payload = await request.text()
  const event = await stripeClient()
    .webhooks.constructEventAsync(
      payload,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
      undefined,
      // The sync constructEvent wants Node crypto, which Workers do not have.
      Stripe.createSubtleCryptoProvider(),
    )
    .catch(() => null)
  if (!event) error(400, 'Bad signature.')

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    // A session without our job id was not started by this site; leave it be.
    if (session.metadata?.job) {
      console.log(`checkout complete ${session.metadata.job} (${session.payment_status})`)
    }
  }

  return new Response(null, { status: 200 })
}
