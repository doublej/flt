import type { Column } from '$lib/components/SplitFlapBoard.svelte'

export const COLUMNS: Column[] = [
  { id: 'time', label: 'Time', width: 5 },
  { id: 'flight', label: 'Flight', width: 6 },
  { id: 'to', label: 'Destination', width: 18 },
  { id: 'gate', label: 'Gate', width: 3, align: 'right' },
  { id: 'status', label: 'Status', width: 9 },
]

const BOARD = [
  { time: '06.15', flight: 'KL0861', to: 'TOKYO HANEDA', via: 'SEOUL', gate: 'F7' },
  { time: '07.40', flight: 'AF1641', to: 'PARIS CDG', via: '', gate: 'D22' },
  { time: '08.05', flight: 'IB3253', to: 'MADRID BARAJAS', via: '', gate: 'B14' },
  { time: '08.55', flight: 'LH1004', to: 'FRANKFURT MAIN', via: '', gate: 'D61' },
  { time: '09.30', flight: 'TK1952', to: 'ISTANBUL', via: 'SOFIA', gate: 'G3' },
  { time: '10.10', flight: 'SQ0323', to: 'SINGAPORE CHANGI', via: 'DUBAI', gate: 'E18' },
  { time: '11.25', flight: 'AZ0109', to: 'ROMA FIUMICINO', via: '', gate: 'C9' },
  { time: '12.00', flight: 'BA0431', to: 'LONDON HEATHROW', via: '', gate: 'D8' },
  { time: '12.45', flight: 'OS0372', to: 'WIEN SCHWECHAT', via: '', gate: 'B7' },
  { time: '13.20', flight: 'SK0552', to: 'STOCKHOLM ARLANDA', via: 'OSLO', gate: 'F2' },
  { time: '14.05', flight: 'QR0274', to: 'DOHA HAMAD', via: '', gate: 'G11' },
  { time: '14.50', flight: 'DL0259', to: 'ATLANTA', via: 'BOSTON', gate: 'E5' },
  { time: '15.35', flight: 'LX0729', to: 'ZURICH KLOTEN', via: '', gate: 'C3' },
  { time: '16.10', flight: 'EK0150', to: 'DUBAI', via: '', gate: 'G9' },
]

export const STATES = ['BOARDING', 'GATE OPEN', 'ON TIME', 'DELAYED', 'FINAL CALL', 'GO TO GATE']

/** One clock for whichever page is open. Every demo board reads the same beat. */
export const clock = $state({ beat: 0 })

export function startClock(ms = 5000) {
  const t = setInterval(() => {
    clock.beat++
  }, ms)
  return () => clearInterval(t)
}

export function departures(beat: number, count = BOARD.length): Record<string, string>[] {
  return Array.from({ length: count }, (_, i) => ({
    ...BOARD[(i + beat) % BOARD.length],
    status: STATES[(i * 3 + beat) % STATES.length],
  }))
}
