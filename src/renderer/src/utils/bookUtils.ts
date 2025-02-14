import { Book } from '../../../types'

type SortKey = 'title' | 'creators' | 'ndc' | 'publisher' | 'location1' | 'location2'
type SortOrder = 'asc' | 'desc'

export interface SortConfig {
  key: SortKey
  order: SortOrder
}

export function sortBooks(books: Book[], config: SortConfig): Book[] {
  return [...books].sort((a, b) => {
    const aValue = a[config.key] || ''
    const bValue = b[config.key] || ''
    const comparison = String(aValue).localeCompare(String(bValue))
    return config.order === 'asc' ? comparison : -comparison
  })
}

export interface SearchConfig {
  title?: string
  publisher?: string
  creators?: string
  tagIds?: number[]
}

export function searchBooks(books: Book[], search: SearchConfig): Book[] {
  return books.filter((book) => {
    const matchTitle =
      !search.title || book.title.toLowerCase().includes(search.title.toLowerCase())
    const matchPublisher =
      !search.publisher || book.publisher.toLowerCase().includes(search.publisher.toLowerCase())
    const matchCreators =
      !search.creators || book.creators.toLowerCase().includes(search.creators.toLowerCase())
    const matchTags =
      !search.tagIds?.length ||
      search.tagIds.every((tagId) => book.tags.some((tag) => tag.id === tagId))

    return matchTitle && matchPublisher && matchCreators && matchTags
  })
}
