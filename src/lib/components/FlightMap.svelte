<script lang="ts">
import { getCoords } from '$lib/data/airports'
import type { FlightLeg } from '$lib/types'
import { greatCirclePoints } from '$lib/utils/geo'
import { onMount } from 'svelte'
import 'leaflet/dist/leaflet.css'

const { legs }: { legs: FlightLeg[] } = $props()

let mapEl = $state<HTMLDivElement | null>(null)

const waypoints = $derived.by(() => {
  const codes: string[] = []
  for (const leg of legs) {
    if (!codes.length || codes[codes.length - 1] !== leg.departure_airport)
      codes.push(leg.departure_airport)
    codes.push(leg.arrival_airport)
  }
  return codes
    .map((code) => ({ code, coords: getCoords(code) }))
    .filter((p): p is { code: string; coords: [number, number] } => p.coords !== null)
})

const canRender = $derived(waypoints.length >= 2)

onMount(() => {
  if (!canRender || !mapEl) return

  let map: L.Map | undefined

  const el = mapEl
  import('leaflet').then((L) => {
    map = L.map(el, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoom: false,
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
    }).addTo(map)

    const allLatLngs: L.LatLng[] = []

    for (const wp of waypoints) {
      const ll = L.latLng(wp.coords[0], wp.coords[1])
      allLatLngs.push(ll)

      L.circleMarker(ll, {
        radius: 4,
        fillColor: '#f0a030',
        color: '#f0a030',
        weight: 1,
        fillOpacity: 0.9,
      }).addTo(map)

      L.marker(ll, {
        icon: L.divIcon({
          className: 'flight-map-label',
          html: wp.code,
          iconSize: [40, 14],
          iconAnchor: [20, -6],
        }),
      }).addTo(map)
    }

    for (let i = 0; i < waypoints.length - 1; i++) {
      const arc = greatCirclePoints(waypoints[i].coords, waypoints[i + 1].coords, 50)
      L.polyline(
        arc.map(([lat, lon]) => L.latLng(lat, lon)),
        { color: '#f0a030', weight: 2, opacity: 0.7, dashArray: '6 4' },
      ).addTo(map)
    }

    const bounds = L.latLngBounds(allLatLngs)
    map.fitBounds(bounds, { padding: [30, 30] })
  })

  return () => map?.remove()
})
</script>

{#if canRender}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="map-wrap" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()}>
		<div class="map" bind:this={mapEl}></div>
	</div>
{/if}

<style>
	.map-wrap {
		margin-top: 12px;
		border-radius: 6px;
		overflow: hidden;
		border: 1px solid var(--color-border);
	}
	.map {
		height: 160px;
		width: 100%;
		background: var(--color-bg);
	}
	:global(.flight-map-label) {
		font-family: var(--font-mono);
		font-size: 0.65rem;
		color: #e6edf3;
		text-align: center;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
		background: none !important;
		border: none !important;
	}
</style>
