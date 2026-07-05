import {defineField, defineType} from 'sanity'

const genreTagOptions = [
  {title: 'Soul', value: 'soul'},
  {title: 'Reggae', value: 'reggae'},
  {title: 'Indie', value: 'indie'},
  {title: 'Talk', value: 'talk'},
  {title: 'Hip Hop', value: 'hip-hop'},
  {title: 'Comedy', value: 'comedy'},
  {title: 'Rave', value: 'rave'},
  {title: 'Electronic', value: 'electronic'},
]

export const show = defineType({
  name: 'show',
  title: 'Show',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Show title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'e.g. show-1',
      options: {source: 'title', maxLength: 96},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'hosts',
      title: 'Hosts',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'schedule',
      title: 'Schedule',
      type: 'string',
      description: 'e.g. Tuesdays @ 7pm',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'tags',
      title: 'Genres',
      type: 'array',
      of: [{type: 'string'}],
      options: {list: genreTagOptions},
      validation: (rule) => rule.required().min(1),
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
      name: 'body',
      title: 'Description',
      type: 'array',
      of: [{type: 'block'}],
    }),
  ],
  orderings: [
    {
      title: 'Title, A–Z',
      name: 'titleAsc',
      by: [{field: 'title', direction: 'asc'}],
    },
  ],
  preview: {
    select: {
      title: 'title',
      hosts: 'hosts',
      schedule: 'schedule',
      media: 'coverImage',
    },
    prepare({title, hosts, schedule, media}) {
      return {
        title,
        subtitle: [hosts, schedule].filter(Boolean).join(' · '),
        media,
      }
    },
  },
})
