export const ARTICLES_LIST_QUERY = `
  *[_type == "article"] | order(publishedAt desc) {
    _id,
    title,
    author,
    publishedAt,
    coarseTag,
    granularTag,
    slug,
    coverImage {
      alt,
      asset
    }
  }
`

export const ARTICLE_BY_SLUG_QUERY = `
  *[_type == "article" && slug.current == $slug][0] {
    _id,
    title,
    author,
    publishedAt,
    coarseTag,
    granularTag,
    slug,
    coverImage {
      alt,
      asset
    },
    body
  }
`

export const SHOWS_LIST_QUERY = `
  *[_type == "show"] | order(title asc) {
    _id,
    title,
    hosts,
    schedule,
    tags,
    slug,
    coverImage {
      alt,
      asset
    }
  }
`

export const SHOW_BY_SLUG_QUERY = `
  *[_type == "show" && slug.current == $slug][0] {
    _id,
    title,
    hosts,
    schedule,
    tags,
    slug,
    coverImage {
      alt,
      asset
    },
    body
  }
`
