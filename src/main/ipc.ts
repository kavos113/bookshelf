import {
  db,
  fetchBookDataFromNDL,
  addTag,
  getAllTags,
  addBookTag,
  removeBookTag,
  getBooksByTagIds
} from './database'
import { ipcMain } from 'electron'
import { Book, Tag } from '../types'

export function setupIpcHandlers(): void {
  ipcMain.handle('fetch-book-data', async (_event, isbn: string) => {
    try {
      const bookData = await fetchBookDataFromNDL(isbn)
      return bookData
    } catch (error) {
      console.error('Error in fetch-book-data:', error)
      throw error
    }
  })

  ipcMain.handle('add-book', async (_event, book: Book) => {
    const {
      isbn,
      title,
      title_ruby,
      alt_title,
      alt_title_ruby,
      series,
      series_ruby,
      creators,
      publisher,
      date,
      price,
      pages,
      ndc,
      location1,
      location2,
      url,
      tags
    } = book

    return new Promise<{ id: number }>((resolve, reject) => {
      db.run(
        'INSERT INTO books (isbn, title, title_ruby, alt_title, alt_title_ruby, series, series_ruby, creators, publisher, date, price, pages, ndc, location1, location2, url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          isbn,
          title,
          title_ruby,
          alt_title,
          alt_title_ruby,
          series,
          series_ruby,
          creators,
          publisher,
          date,
          price,
          pages,
          ndc,
          location1,
          location2,
          url
        ],
        function (err) {
          if (err) {
            reject(err)
            return
          }

          const bookId = this.lastID
          const tagPromises = (tags || []).map((tag) => {
            return new Promise<void>((resolve, reject) => {
              db.run(
                'INSERT INTO tags (name) VALUES (?) ON CONFLICT(name) DO NOTHING',
                [tag.name],
                function (err) {
                  if (err) {
                    reject(err)
                    return
                  }

                  db.get<Tag>(
                    'SELECT id, name FROM tags WHERE name = ?',
                    [tag.name],
                    (err, row) => {
                      if (err) {
                        reject(err)
                        return
                      }

                      if (row) {
                        db.run(
                          'INSERT INTO book_tags (book_id, tag_id) VALUES (?, ?)',
                          [bookId, row.id],
                          (err) => {
                            if (err) {
                              reject(err)
                            } else {
                              resolve()
                            }
                          }
                        )
                      }
                    }
                  )
                }
              )
            })
          })

          Promise.all(tagPromises)
            .then(() => resolve({ id: bookId }))
            .catch(reject)
        }
      )
    })
  })

  ipcMain.handle('get-books', async () => {
    return new Promise<Book[]>((resolve, reject) => {
      db.all<Book>('SELECT * FROM books', (err, rows) => {
        if (err) {
          reject(err)
          return
        }

        const bookPromises = rows.map((book) => {
          return new Promise<Book>((resolve, reject) => {
            db.all<Tag>(
              'SELECT tags.id, tags.name FROM tags JOIN book_tags ON tags.id = book_tags.tag_id WHERE book_tags.book_id = ?',
              [book.id],
              (err, tags) => {
                if (err) {
                  reject(err)
                  return
                }

                book.tags = tags
                resolve(book)
              }
            )
          })
        })

        Promise.all(bookPromises).then(resolve).catch(reject)
      })
    })
  })

  ipcMain.handle('delete-book', async (_event, id: number) => {
    return new Promise<{ changes: number }>((resolve, reject) => {
      db.run('DELETE FROM books WHERE id = ?', id, function (err) {
        if (err) {
          reject(err)
          return
        }

        db.run('DELETE FROM book_tags WHERE book_id = ?', id, (err) => {
          if (err) {
            reject(err)
          } else {
            resolve({ changes: this.changes })
          }
        })
      })
    })
  })

  ipcMain.handle('update-book-location', async (_event, { id, location1, location2 }) => {
    return new Promise<void>((resolve, reject) => {
      db.run(
        'UPDATE books SET location1 = ?, location2 = ? WHERE id = ?',
        [location1, location2, id],
        (err) => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        }
      )
    })
  })

  ipcMain.handle('add-tag', async (_event, name: string) => {
    try {
      const tagId = await addTag(name)
      return { id: tagId, name }
    } catch (error) {
      console.error('Error in add-tag:', error)
      throw error
    }
  })

  ipcMain.handle('get-all-tags', async () => {
    try {
      return await getAllTags()
    } catch (error) {
      console.error('Error in get-all-tags:', error)
      throw error
    }
  })

  ipcMain.handle('add-book-tag', async (_event, { bookId, tagId }) => {
    try {
      await addBookTag(bookId, tagId)
      return { success: true }
    } catch (error) {
      console.error('Error in add-book-tag:', error)
      throw error
    }
  })

  ipcMain.handle('remove-book-tag', async (_event, { bookId, tagId }) => {
    try {
      await removeBookTag(bookId, tagId)
      return { success: true }
    } catch (error) {
      console.error('Error in remove-book-tag:', error)
      throw error
    }
  })

  ipcMain.handle('get-books-by-tags', async (_event, tagIds: number[]) => {
    try {
      return await getBooksByTagIds(tagIds)
    } catch (error) {
      console.error('Error in get-books-by-tags:', error)
      throw error
    }
  })
}
