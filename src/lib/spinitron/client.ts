import type {
  NowPlaying,
  SpinitronListResponse,
  SpinitronPersona,
  SpinitronShow,
  SpinitronSpin,
} from './types'

const DEFAULT_API_BASE = '/api/spinitron'

export function isSpinitronConfigured(): boolean {
  return Boolean(import.meta.env.VITE_SPINITRON_API_TOKEN)
}

function getApiBase(): string {
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

export async function fetchNowPlaying(): Promise<NowPlaying> {
  const [spinsResponse, showsResponse] = await Promise.all([
    spinitronFetch<SpinitronListResponse<SpinitronSpin>>('/spins?count=1'),
    spinitronFetch<SpinitronListResponse<SpinitronShow>>('/shows?count=1'),
  ])

  const spin = spinsResponse?.items?.[0]
  const show = showsResponse?.items?.[0]
  const host = show ? await fetchPersonaName(show) : undefined

  const currentSpin = spin && isActiveNow(spin) ? spin : undefined
  const currentShow = show && isActiveNow(show) ? show : undefined

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
