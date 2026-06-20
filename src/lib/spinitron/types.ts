export type SpinitronLink = {
  href: string
}

export type SpinitronSpin = {
  id: number
  song: string
  artist: string
  start: string
  end?: string | null
  duration?: number
  image?: string
  _links?: {
    self?: SpinitronLink
    playlist?: SpinitronLink
  }
}

export type SpinitronShow = {
  id: number
  title: string
  start: string
  end: string
  timezone?: string
  _links?: {
    self?: SpinitronLink
    personas?: SpinitronLink[]
    playlists?: SpinitronLink
  }
}

export type SpinitronPersona = {
  id: number
  name: string
}

export type SpinitronListResponse<T> = {
  items: T[]
  _meta?: {
    total?: number
  }
}

export type NowPlaying = {
  title: string
  subtitle: string
  song?: string
  artist?: string
  showTitle?: string
  host?: string
}
