import { Book, Tag } from '../types'

// IPC channels
interface BooksChannels {
  ping: void
  'fetch-book-data': Book
  'add-book': { id: number }
  'get-books': Book[]
  'delete-book': { changes: number }
}

// Channel arguments
interface BooksChannelArgs {
  ping: []
  'fetch-book-data': [string]
  'add-book': [Book]
  'get-books': []
  'delete-book': [number]
}

export interface IElectronAPI {
  ipcRenderer: {
    send: <T extends keyof BooksChannels>(channel: T, ...args: BooksChannelArgs[T]) => void
    invoke: <T extends keyof BooksChannels>(
      channel: T,
      ...args: BooksChannelArgs[T]
    ) => Promise<BooksChannels[T]>
    on: <T extends keyof BooksChannels>(
      channel: T,
      func: (...args: BooksChannelArgs[T]) => void
    ) => void
    once: <T extends keyof BooksChannels>(
      channel: T,
      func: (...args: BooksChannelArgs[T]) => void
    ) => void
  }
}

declare global {
  interface Window {
    electron: IElectronAPI
    api: {
      fetchBookData: (isbn: string) => Promise<Book>
      addBook: (book: Book) => Promise<{ id: number }>
      getBooks: () => Promise<Book[]>
      deleteBook: (id: number) => Promise<{ changes: number }>
    }
  }
}
