export type TickerData = {
  onAir: string
  upNext: string
}

export const TICKER_SEPARATOR = ' ⬤ '

export const TICKER_STATION_LABEL = '101.1fm brown student and community radio'

export const DEFAULT_TICKER_DATA: TickerData = {
  onAir: '—',
  upNext: '—',
}

export function formatTickerText({ onAir, upNext }: TickerData): string {
  return `${TICKER_STATION_LABEL}${TICKER_SEPARATOR}on air: ${onAir}${TICKER_SEPARATOR}up next: ${upNext}${TICKER_SEPARATOR}`
}

export const DEFAULT_TICKER_TEXT = formatTickerText(DEFAULT_TICKER_DATA)
