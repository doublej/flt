/** bun run src/lib/brief.test.ts */
import { type BriefFields, briefAmount, isSettled, newJob, packBrief, unpackBrief } from './brief'
import { TIERS } from './tiers'

let n = 0
function ok(what: string, cond: boolean) {
  n++
  if (!cond) throw new Error(`FAIL: ${what}`)
}

const fields: BriefFields = {
  tier: 'survey',
  to: 'Vietnam',
  from: 'Amsterdam',
  month: 'November',
  length: 'A week',
  dates: 'Give or take a few days',
  cabin: 'Economy',
  priorities: ['Price', 'Fewest stops'],
  dislikes: [],
  dealbreakers: ['Gulf hubs'],
  notes: 'Travelling with a toddler 🍼, so nothing before eight. '.repeat(20),
}

const packed = packBrief(fields)
ok(
  'no chunk exceeds the 500-character cap',
  Object.values(packed).every((v) => v.length <= 500),
)
ok('a long brief takes more than one chunk', Object.keys(packed).length > 1)
ok(
  'chunks are numbered from zero with no gaps',
  Object.keys(packed).every((k, i) => k === `brief${i}`),
)
ok(
  'a round trip returns the brief unchanged',
  JSON.stringify(unpackBrief(packed)) === JSON.stringify(fields),
)
ok('an emoji survives being split across chunks', unpackBrief(packed).notes === fields.notes)

const short = packBrief({ ...fields, notes: '' })
ok('a short brief is one chunk', Object.keys(short).length === 1)
ok('a short brief round trips too', unpackBrief(short).notes === '')

ok(
  'a brief far over the cap is refused',
  (() => {
    try {
      packBrief({ ...fields, notes: 'x'.repeat(6000) })
      return false
    } catch {
      return true
    }
  })(),
)

// The money path: the amount charged comes from the tier, never from a client.
ok('enquiry is 300 cents', briefAmount(TIERS[0]) === 300)
ok('flexible is 500 cents', briefAmount(TIERS[1]) === 500)
ok('survey is 1000 cents', briefAmount(TIERS[2]) === 1000)

// A 100%-off voucher completes the session without a payment method. Narrowing
// this back to 'paid' would drop every free brief on the floor.
ok('a paid session settles', isSettled('paid'))
ok('a voucher session settles', isSettled('no_payment_required'))
ok('an unpaid session does not', !isSettled('unpaid'))

ok('a job id is four hex characters', /^[0-9a-f]{4}$/.test(newJob()))
ok('job ids are not all the same', new Set(Array.from({ length: 50 }, newJob)).size > 1)

console.log(`brief: ${n} assertions passed`)
