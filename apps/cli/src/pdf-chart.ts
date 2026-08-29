import type jsPDF from 'jspdf'
import type { DayPrice } from './pdf-summary'

const INK = '#14181f'
const MUTED = '#6b7280'
const GRID = '#e8ebee'
const LOW = '#0b5563'
const AVG = '#a8c6cb'
const FONT = 'helvetica'

/** Round a price axis up to a clean step so gridline labels read well. */
function niceMax(value: number): number {
  const step = value > 2000 ? 500 : value > 800 ? 200 : value > 300 ? 100 : 50
  return Math.ceil(value / step) * step
}

function shortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
}

/**
 * Grouped bar chart: lowest and average fare for each departure date.
 * Drawn with primitives so the report pulls in no charting dependency.
 */
export function drawPriceChart(
  doc: jsPDF,
  days: DayPrice[],
  currency: string,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  if (days.length === 0) return

  const axisW = 16
  const labelH = 9
  const plotX = x + axisW
  const plotW = w - axisW
  const plotH = h - labelH
  const max = niceMax(Math.max(...days.map((d) => d.avg)) * 1.08)

  const yOf = (v: number) => y + plotH - (v / max) * plotH

  // Gridlines and price axis
  doc.setFontSize(6.5)
  doc.setFont(FONT, 'normal')
  for (let i = 0; i <= 4; i++) {
    const value = (max / 4) * i
    const gy = yOf(value)
    doc.setDrawColor(GRID)
    doc.setLineWidth(0.2)
    doc.line(plotX, gy, plotX + plotW, gy)
    doc.setTextColor(MUTED)
    doc.text(`${currency}${Math.round(value)}`, plotX - 2, gy + 1.2, { align: 'right' })
  }

  // Bars, two per date
  const group = plotW / days.length
  const barW = Math.min(9, group * 0.3)
  const showValues = days.length <= 10
  for (const [i, d] of days.entries()) {
    const cx = plotX + group * i + group / 2
    const lowX = cx - barW - 0.8
    const avgX = cx + 0.8

    doc.setFillColor(LOW)
    doc.rect(lowX, yOf(d.low), barW, plotH - (yOf(d.low) - y), 'F')
    doc.setFillColor(AVG)
    doc.rect(avgX, yOf(d.avg), barW, plotH - (yOf(d.avg) - y), 'F')

    if (showValues) {
      doc.setFontSize(6)
      doc.setTextColor(INK)
      doc.setFont(FONT, 'bold')
      doc.text(`${currency}${Math.round(d.low)}`, lowX + barW / 2, yOf(d.low) - 1.5, {
        align: 'center',
      })
      doc.setFont(FONT, 'normal')
      doc.setTextColor(MUTED)
      doc.text(`${currency}${Math.round(d.avg)}`, avgX + barW / 2, yOf(d.avg) - 1.5, {
        align: 'center',
      })
    }

    doc.setFontSize(6.5)
    doc.setFont(FONT, 'normal')
    doc.setTextColor(MUTED)
    doc.text(shortDate(d.date), cx, y + plotH + 4.5, { align: 'center' })
  }

  // Baseline
  doc.setDrawColor(MUTED)
  doc.setLineWidth(0.3)
  doc.line(plotX, y + plotH, plotX + plotW, y + plotH)
}

/** Swatch legend for the two series. */
export function drawChartLegend(doc: jsPDF, x: number, y: number): void {
  const items: Array<[string, string]> = [
    [LOW, 'Lowest fare that day'],
    [AVG, 'Average of all fares that day'],
  ]
  let lx = x
  doc.setFontSize(7)
  doc.setFont(FONT, 'normal')
  for (const [color, label] of items) {
    doc.setFillColor(color)
    doc.rect(lx, y - 2.2, 3, 3, 'F')
    doc.setTextColor(MUTED)
    doc.text(label, lx + 4.5, y)
    lx += doc.getTextWidth(label) + 14
  }
}
