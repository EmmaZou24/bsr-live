export const ROUTES = {
  home: '/',
  schedule: '/schedule',
  articles: '/articles',
  shows: '/shows',
} as const

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]

export function articleRoute(slug: string) {
  return `${ROUTES.articles}/${slug}`
}

export function showRoute(slug: string) {
  return `${ROUTES.shows}/${slug}`
}

export const navIdToPath: Record<string, AppRoute> = {
  schedule: ROUTES.schedule,
  articles: ROUTES.articles,
  shows: ROUTES.shows,
}
