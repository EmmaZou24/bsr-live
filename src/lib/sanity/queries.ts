const articleListProjection = `
  _id,
  _type,
  title,
  author,
  publishedAt,
  granularTag,
  slug,
  coverImage {
    alt,
    asset
  }
`

const articleDetailProjection = `
  ${articleListProjection},
  articleImages[] {
    alt,
    asset
  },
  body,
  description,
  transcript,
  interviewLink,
  audioFile {
    asset-> {
      url
    }
  }
`

export const ARTICLES_LIST_QUERY = `
  *[_type in ["blog", "news", "interview"]] | order(publishedAt desc) {
    ${articleListProjection}
  }
`

export const ARTICLE_BY_SLUG_QUERY = `
  *[_type in ["blog", "news", "interview"] && slug.current == $slug][0] {
    ${articleDetailProjection}
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
