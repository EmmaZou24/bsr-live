import {defineField, defineType} from 'sanity'
import {articlePreview, publishedAtOrdering, sharedArticleFields} from './articleShared'

export const interview = defineType({
  name: 'interview',
  title: 'Interview',
  type: 'document',
  fields: [
    ...sharedArticleFields,
    defineField({
      name: 'description',
      title: 'Description',
      type: 'array',
      of: [{type: 'block'}],
    }),
    defineField({
      name: 'transcript',
      title: 'Transcript',
      type: 'array',
      of: [{type: 'block'}],
    }),
    defineField({
      name: 'interviewLink',
      title: 'Interview link',
      type: 'url',
      validation: (rule) =>
        rule.uri({
          allowRelative: false,
          scheme: ['http', 'https'],
        }),
    }),
  ],
  orderings: [publishedAtOrdering],
  preview: articlePreview('Interview'),
})
