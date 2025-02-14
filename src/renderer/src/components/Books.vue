<template>
  <div class="books-container">
    <div class="content-panel">
      <h1>Books</h1>
      <BookInputForm @submit="searchAndAddBook" />
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>NDC</th>
              <th>Publisher</th>
              <th>Tags</th>
              <th>Location 1</th>
              <th>Location 2</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="book in books"
              :key="book.id"
              :class="{ selected: selectedBook?.id === book.id }"
              @click="selectBook(book)"
            >
              <td>{{ book.title }}</td>
              <td>{{ book.creators }}</td>
              <td>{{ book.ndc }}</td>
              <td>{{ book.publisher }}</td>
              <td>
                <span v-for="tag in book.tags" :key="tag.id" class="tag">
                  {{ tag.name }}
                </span>
              </td>
              <td>{{ book.location1 }}</td>
              <td>{{ book.location2 }}</td>
              <td>
                <button class="delete-btn" @click.stop="deleteBook(book.id!)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <BookDetails :book="selectedBook" @close="closeDetails" @update-location="updateBookLocation" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Book } from '../../../types'
import BookDetails from './BookDetails.vue'
import BookInputForm from './BookInputForm.vue'

const books = ref<Book[]>([])
const selectedBook = ref<Book | null>(null)

const selectBook = (book: Book) => {
  selectedBook.value = book
}

const closeDetails = () => {
  selectedBook.value = null
}

const searchAndAddBook = async ({
  isbn,
  location1,
  location2
}: {
  isbn: string
  location1: string
  location2: string
}) => {
  try {
    const bookData = await window.electron.ipcRenderer.invoke('fetch-book-data', isbn)
    bookData.location1 = location1
    bookData.location2 = location2

    await window.electron.ipcRenderer.invoke('add-book', bookData)
    fetchBooks()
  } catch (error) {
    console.error('Error processing book data:', error)
  }
}

const fetchBooks = async () => {
  books.value = await window.electron.ipcRenderer.invoke('get-books')
}

const deleteBook = async (id: number) => {
  if (selectedBook.value?.id === id) {
    selectedBook.value = null
  }
  await window.electron.ipcRenderer.invoke('delete-book', id)
  fetchBooks()
}

const updateBookLocation = async () => {
  if (!selectedBook.value) return

  try {
    await window.electron.ipcRenderer.invoke('update-book-location', {
      id: selectedBook.value.id,
      location1: selectedBook.value.location1,
      location2: selectedBook.value.location2
    })
    fetchBooks()
  } catch (error) {
    console.error('Error updating book location:', error)
  }
}

onMounted(fetchBooks)
</script>

<style scoped>
.books-container {
  position: relative;
  height: 100%;
}

.content-panel {
  height: 100%;
  overflow-y: auto;
  padding: 0 20px;
}

.table-container {
  margin-top: 20px;
  overflow-x: auto;
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

table {
  width: 100%;
  border-collapse: collapse;
  background: var(--color-background);
}

th,
td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

th {
  background: var(--color-background-soft);
  font-weight: 600;
}

tr:hover {
  background: var(--color-background-soft);
  cursor: pointer;
}

tr.selected {
  background: var(--ev-c-gray-1);
}

.tag {
  display: inline-block;
  padding: 2px 8px;
  margin: 2px;
  background: var(--ev-c-gray-1);
  border-radius: 12px;
  font-size: 0.8em;
}

.delete-btn {
  padding: 8px 16px;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.delete-btn:hover {
  background-color: #da190b;
}
</style>
