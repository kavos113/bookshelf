import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { db, fetchBookDataFromNDL } from './database'
import { Book, Tag } from '../types'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

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

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
