import { DEFAULT_TICKER_DATA, type TickerData } from './ticker'
import type {
  NowPlaying,
  SpinitronListResponse,
  SpinitronLiveData,
  SpinitronPersona,
  SpinitronShow,
  SpinitronSpin,
} from './types'

const DEFAULT_API_BASE = '/api/spinitron'

export function isSpinitronConfigured(): boolean {
  return Boolean(import.meta.env.VITE_SPINITRON_API_TOKEN)
}

function getApiBase(): string {
  // In dev, always use the Vite proxy so the Bearer token stays server-side.
  if (import.meta.env.DEV) {
    return DEFAULT_API_BASE
  }
  return import.meta.env.VITE_SPINITRON_API_BASE ?? DEFAULT_API_BASE
}

function isActiveNow(item: { start: string; end?: string | null }): boolean {
  const now = Date.now()
  const start = new Date(item.start).getTime()
  const end = item.end ? new Date(item.end).getTime() : null

  if (Number.isNaN(start) || start > now) return false
  if (end !== null && !Number.isNaN(end) && end <= now) return false
  return true
}

function personaPathFromHref(href: string): string | null {
  const match = href.match(/\/personas\/(\d+)/)
  if (!match) return null
  return `/personas/${match[1]}`
}

async function spinitronFetch<T>(path: string): Promise<T | null> {
  const response = await fetch(`${getApiBase()}${path}`, {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Spinitron request failed (${response.status}) for ${path}`)
  }

  return (await response.json()) as T
}

async function fetchPersonaName(show: SpinitronShow): Promise<string | undefined> {
  const personaHref = show._links?.personas?.[0]?.href
  if (!personaHref) return undefined

  const personaPath = personaPathFromHref(personaHref)
  if (!personaPath) return undefined

  const persona = await spinitronFetch<SpinitronPersona>(personaPath)
  return persona?.name
}

function formatSongLabel(spin?: SpinitronSpin): string {
  if (!spin?.song) return '—'

  const song = spin.song.trim()
  const artist = spin.artist?.trim()

  if (artist) return `${song} — ${artist}`
  return song
}

function findCurrentSpin(spins: SpinitronSpin[]): SpinitronSpin | undefined {
  return spins.find((spin) => isActiveNow(spin)) ?? spins[0]
}

function findUpNextSpin(spins: SpinitronSpin[]): SpinitronSpin | undefined {
  const now = Date.now()
  return spins.find((spin) => {
    const start = new Date(spin.start).getTime()
    return !Number.isNaN(start) && start > now
  })
}

function findUpcomingShow(shows: SpinitronShow[]): SpinitronShow | undefined {
  const now = Date.now()
  return shows.find((show) => {
    const start = new Date(show.start).getTime()
    return !Number.isNaN(start) && start > now
  })
}

function buildNowPlaying(
  currentSpin: SpinitronSpin | undefined,
  currentShow: SpinitronShow | undefined,
  host: string | undefined,
): NowPlaying {
  if (currentSpin) {
    return {
      title: currentSpin.song,
      subtitle: currentSpin.artist,
      song: currentSpin.song,
      artist: currentSpin.artist,
      showTitle: currentShow?.title,
      host,
    }
  }

  if (currentShow) {
    return {
      title: currentShow.title,
      subtitle: host ? `by ${host}` : 'Live on BSR',
      showTitle: currentShow.title,
      host,
    }
  }

  return {
    title: 'Brown Student Radio',
    subtitle: 'Live on BSR',
  }
}

function buildTickerData(
  currentSpin: SpinitronSpin | undefined,
  upNextSpin: SpinitronSpin | undefined,
  upcomingShow: SpinitronShow | undefined,
): TickerData {
  const onAir = formatSongLabel(currentSpin)

  let upNext = formatSongLabel(upNextSpin)
  if (upNext === '—' && upcomingShow?.title) {
    upNext = upcomingShow.title
  }

  return { onAir, upNext }
}

export async function fetchLiveBroadcast(): Promise<SpinitronLiveData> {
  const [spinsResponse, showsResponse] = await Promise.all([
    spinitronFetch<SpinitronListResponse<SpinitronSpin>>('/spins?count=25'),
    spinitronFetch<SpinitronListResponse<SpinitronShow>>('/shows?count=5'),
  ])

  const spins = spinsResponse?.items ?? []
  const shows = showsResponse?.items ?? []

  const currentSpin = findCurrentSpin(spins)
  const currentShow = shows.find((show) => isActiveNow(show))
  const host = currentShow ? await fetchPersonaName(currentShow) : undefined

  const upNextSpin = findUpNextSpin(spins)
  const upcomingShow = findUpcomingShow(shows)

  return {
    nowPlaying: buildNowPlaying(currentSpin, currentShow, host),
    ticker: buildTickerData(currentSpin, upNextSpin, upcomingShow),
  }
}

export async function fetchNowPlaying(): Promise<NowPlaying> {
  const live = await fetchLiveBroadcast()
  return live.nowPlaying
}

export function getDefaultLiveBroadcast(): SpinitronLiveData {
  return {
    nowPlaying: {
      title: 'Brown Student Radio',
      subtitle: 'Live on BSR',
    },
    ticker: DEFAULT_TICKER_DATA,
  }
}
