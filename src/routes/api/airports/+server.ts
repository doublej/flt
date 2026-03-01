import { json } from '@sveltejs/kit'
import { searchAirports } from '$lib/server/flights/airports'

export async function GET({ url }) {
  const q = url.searchParams.get('q') ?? ''
  if (q.length < 1) return json([])
  return json(searchAirports(q))
}
