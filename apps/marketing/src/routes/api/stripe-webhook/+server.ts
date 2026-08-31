import { env } from '$env/dynamic/private'
import { unpackBrief } from '$lib/brief'
import { enqueueBrief } from '$lib/server/queue'
import { stripeClient } from '$lib/server/stripe'
import { error } from '@sveltejs/kit'
import Stripe from 'stripe'
import type { RequestHandler } from './$types'

export const prerender = false

/** Stripe telling us the money arrived. Everything downstream of the signature
 *  check is trusted, so nothing above it may have a side effect. */
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
    const job = session.metadata?.job

    // A session without our job id was not started by this site; leave it be.
    if (job) {
      await enqueueBrief({
        job,
        ...unpackBrief(session.metadata ?? {}),
        amount: session.amount_total ?? 0,
        currency: 'eur',
        email: session.customer_details?.email ?? session.customer_email ?? '',
        paidAt: new Date(event.created * 1000).toISOString(),
      })
    }
  }

  return new Response(null, { status: 200 })
}
