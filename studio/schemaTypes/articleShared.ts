import {defineField} from 'sanity'

export const granularTagOptions = [
  {title: 'Community', value: 'community'},
  {title: 'New Music', value: 'new-music'},
  {title: 'Listening Guide', value: 'listening-guide'},
  {title: 'Review', value: 'review'},
  {title: 'Electronic', value: 'electronic'},
  {title: 'Indie', value: 'indie'},
]

export function imageField(name: string, title: string) {
  return defineField({
    name,
    title,
    type: 'image',
    options: {hotspot: true},
    fields: [
      defineField({
        name: 'alt',
        title: 'Alt text',
        type: 'string',
      }),
    ],
  })
}

export const sharedArticleFields = [
  defineField({
    name: 'title',
    title: 'Title',
    type: 'string',
    validation: (rule) => rule.required(),
  }),
  defineField({
    name: 'slug',
    title: 'Slug',
    type: 'slug',
    description: 'e.g. blog-1',
    options: {source: 'title', maxLength: 96},
    validation: (rule) => rule.required(),
  }),
  defineField({
    name: 'author',
    title: 'Author',
    type: 'string',
    validation: (rule) => rule.required().max(35),
  }),
  defineField({
    name: 'publishedAt',
    title: 'Published at',
    type: 'datetime',
    validation: (rule) => rule.required(),
  }),
  imageField('coverImage', 'Cover image'),
  defineField({
    name: 'articleImages',
    title: 'Article images',
    type: 'array',
    of: [
      {
        type: 'image',
        options: {hotspot: true},
        fields: [
          defineField({
            name: 'alt',
            title: 'Alt text',
            type: 'string',
          }),
        ],
      },
    ],
  }),
  defineField({
    name: 'granularTag',
    title: 'Topic',
    type: 'string',
    options: {list: granularTagOptions},
  }),
]

export const publishedAtOrdering = {
  title: 'Published date, newest',
  name: 'publishedAtDesc',
  by: [{field: 'publishedAt', direction: 'desc' as const}],
}

export function articlePreview(titleLabel: string) {
  return {
    select: {
      title: 'title',
      author: 'author',
      media: 'coverImage',
      publishedAt: 'publishedAt',
    },
    prepare({
      title,
      author,
      media,
      publishedAt,
    }: {
      title?: string
      author?: string
      media?: unknown
      publishedAt?: string
    }) {
      const date = publishedAt ? new Date(publishedAt).toLocaleDateString() : ''
      return {
        title: title ?? titleLabel,
        subtitle: [author, date].filter(Boolean).join(' · '),
        media,
      }
    },
  }
}
