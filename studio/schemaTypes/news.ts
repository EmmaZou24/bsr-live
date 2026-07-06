import {defineField, defineType} from 'sanity'
import {articlePreview, publishedAtOrdering, sharedArticleFields} from './articleShared'

export const news = defineType({
  name: 'news',
  title: 'News',
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
      name: 'audioFile',
      title: 'Audio file',
      type: 'file',
      options: {
        accept: 'audio/*',
      },
    }),
  ],
  orderings: [publishedAtOrdering],
  preview: articlePreview('News'),
})
