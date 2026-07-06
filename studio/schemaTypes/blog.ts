import {defineField, defineType} from 'sanity'
import {articlePreview, publishedAtOrdering, sharedArticleFields} from './articleShared'

export const blog = defineType({
  name: 'blog',
  title: 'Blog',
  type: 'document',
  fields: [
    ...sharedArticleFields,
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [{type: 'block'}],
    }),
  ],
  orderings: [publishedAtOrdering],
  preview: articlePreview('Blog post'),
})
