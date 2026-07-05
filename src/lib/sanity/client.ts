import {createClient} from '@sanity/client'
import {createImageUrlBuilder, type SanityImageSource} from '@sanity/image-url'

const projectId = import.meta.env.VITE_SANITY_PROJECT_ID
const dataset = import.meta.env.VITE_SANITY_DATASET ?? 'production'
const apiVersion = import.meta.env.VITE_SANITY_API_VERSION ?? '2025-01-01'

export function isSanityConfigured(): boolean {
  return Boolean(projectId)
}

export const sanityClient = createClient({
  projectId: projectId ?? '',
  dataset,
  apiVersion,
  useCdn: true,
})

const imageBuilder = createImageUrlBuilder({
  projectId: projectId ?? '',
  dataset,
})

export function urlForImage(source: SanityImageSource) {
  return imageBuilder.image(source)
}
