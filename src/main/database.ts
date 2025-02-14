import sqlite3 from 'sqlite3'
import { join } from 'path'

const dbPath = join(__dirname, '../../resources/database.sqlite')
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err)
  } else {
    console.log('Database opened successfully')
    db.run(
      `CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      published_date TEXT NOT NULL
    )`,
      (err) => {
        if (err) {
          console.error('Error creating table', err)
        }
      }
    )
  }
})

export { db }
