import {defineField, defineType} from 'sanity'

const coarseTagOptions = [
  {title: 'Blog', value: 'blog'},
  {title: 'News', value: 'news'},
  {title: 'Interviews', value: 'interviews'},
]

const granularTagOptions = [
  {title: 'Community', value: 'community'},
  {title: 'New Music', value: 'new-music'},
  {title: 'Listening Guide', value: 'listening-guide'},
  {title: 'Review', value: 'review'},
  {title: 'Electronic', value: 'electronic'},
  {title: 'Indie', value: 'indie'},
]

export const article = defineType({
  name: 'article',
  title: 'Article',
  type: 'document',
  fields: [
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
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover image',
      type: 'image',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'string',
        }),
      ],
    }),
    defineField({
      name: 'coarseTag',
      title: 'Type',
      type: 'string',
      options: {list: coarseTagOptions},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'granularTag',
      title: 'Topic',
      type: 'string',
      options: {list: granularTagOptions},
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [{type: 'block'}],
    }),
  ],
  orderings: [
    {
      title: 'Published date, newest',
      name: 'publishedAtDesc',
      by: [{field: 'publishedAt', direction: 'desc'}],
    },
  ],
  preview: {
    select: {
      title: 'title',
      author: 'author',
      media: 'coverImage',
      publishedAt: 'publishedAt',
    },
    prepare({title, author, media, publishedAt}) {
      const date = publishedAt ? new Date(publishedAt).toLocaleDateString() : ''
      return {
        title,
        subtitle: [author, date].filter(Boolean).join(' · '),
        media,
      }
    },
  },
})
