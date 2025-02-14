export interface Tag {
  id?: number
  name: string
}

export interface Book {
  id?: number
  isbn: string
  title: string
  title_ruby?: string
  alt_title?: string
  alt_title_ruby?: string
  series?: string
  series_ruby?: string
  creators: string
  publisher: string
  date: string
  price: number
  pages: string
  ndc: string
  location1?: string
  location2?: string
  url: string
  tags?: Tag[]
}
