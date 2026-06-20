export const ROUTES = {
  home: '/',
  schedule: '/schedule',
  articles: '/articles',
  shows: '/shows',
} as const

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]

export const navIdToPath: Record<string, AppRoute> = {
  schedule: ROUTES.schedule,
  articles: ROUTES.articles,
  shows: ROUTES.shows,
}
