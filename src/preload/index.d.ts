import { ElectronAPI } from '@electron-toolkit/preload'
import { Book, Tag } from '../types'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      invoke(channel: 'get-tags-by-book-id', bookId: number): Promise<Tag[]>
    }
  }
}
