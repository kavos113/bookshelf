import { Database } from 'sqlite3'
import { join } from 'path'
import axios from 'axios'
import { parseStringPromise } from 'xml2js'
import { Book } from '../types'

const dbPath = join(__dirname, '../../resources/database.sqlite')
const db = new Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err)
  } else {
    console.log('Database opened successfully')
    db.run(
      `CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      isbn INTEGER NOT NULL,
      title TEXT NOT NULL,
      title_ruby TEXT,
      alt_title TEXT,
      alt_title_ruby TEXT,
      series TEXT,
      series_ruby TEXT,
      creators TEXT,
      publisher TEXT,
      date TEXT,
      price INTEGER,
      pages TEXT,
      ndc REAL,
      location1 TEXT,
      location2 TEXT,
      url TEXT
    )`,
      (err) => {
        if (err) {
          console.error('Error creating books table', err)
        }
      }
    )
    db.run(
      `CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    )`,
      (err) => {
        if (err) {
          console.error('Error creating tags table', err)
        }
      }
    )
    db.run(
      `CREATE TABLE IF NOT EXISTS book_tags (
      book_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      FOREIGN KEY (book_id) REFERENCES books(id),
      FOREIGN KEY (tag_id) REFERENCES tags(id)
    )`,
      (err) => {
        if (err) {
          console.error('Error creating book_tags table', err)
        }
      }
    )
  }
})

async function fetchBookDataFromNDL(isbn: string): Promise<Book> {
  try {
    const apiUrl = `https://ndlsearch.ndl.go.jp/api/sru?operation=searchRetrieve&version=1.2&recordSchema=dcndl&onlyBib=true&recordPacking=xml&query=isbn=${isbn}`
    const response = await axios.get(apiUrl)
    const result = await parseStringPromise(response.data)

    console.log('Result:', result)

    const records = result.searchRetrieveResponse?.records?.[0]?.record
    if (!records || records.length === 0) {
      throw new Error('Book not found')
    }

    const bibResource = records[0].recordData[0]['rdf:RDF'][0]['dcndl:BibResource'][0]

    // Extract book data
    const bookData: Book = {
      isbn,
      title: bibResource['dcterms:title']?.[0] || '',
      title_ruby:
        bibResource['dc:title']?.[0]['rdf:Description']?.[0]['dcndl:transcription']?.[0] || '',
      alt_title:
        bibResource['dcndl:alternative']?.[0]['rdf:Description']?.[0]['rdf:value']?.[0] || '',
      alt_title_ruby: '',
      series: '',
      series_ruby: '',
      creators: (bibResource['dc:creator'] || []).join(', '),
      publisher: bibResource['dcterms:publisher']?.[0]['foaf:Agent']?.[0]['foaf:name']?.[0] || '',
      date: bibResource['dcterms:date']?.[0] || '',
      price: parseInt((bibResource['dcndl:price']?.[0] || '').replace(/[^0-9]/g, '')) || 0,
      pages: bibResource['dcterms:extent']?.[0] || '',
      ndc: '',
      location1:
        bibResource['dcterms:publisher']?.[0]['foaf:Agent']?.[0]['dcndl:location']?.[0] || '',
      location2:
        bibResource['dcterms:publisher']?.[1]?.['foaf:Agent']?.[0]?.['dcndl:location']?.[0] || '',
      url: bibResource['rdfs:seeAlso']?.[0]?.['$']?.['rdf:resource'] || '',
      tags: []
    }

    console.log('Book data:', bookData)

    // Extract NDC
    const subjects = bibResource['dcterms:subject'] || []
    for (const subject of subjects) {
      if (subject?.['rdf:resource']?.[0]?.includes('ndc')) {
        const ndcMatch = subject['rdf:resource'][0].match(/ndc[89]\/([0-9.]+)/)
        if (ndcMatch) {
          bookData.ndc = ndcMatch[1]
          break
        }
      }
    }

    return bookData
  } catch (error) {
    console.error('Error fetching book data:', error)
    throw error
  }
}

export { db, fetchBookDataFromNDL }
