<template>
  <div class="books-container">
    <div class="content-panel">
      <h1>Books</h1>
      <div class="input-form">
        <div class="input-row">
          <input v-model="isbn" placeholder="ISBN" required />
          <input v-model="location1" placeholder="Location 1" />
          <input v-model="location2" placeholder="Location 2" />
        </div>
        <button @click="searchAndAddBook">Add Book</button>
      </div>
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

    <!-- オーバーレイ表示のための詳細パネル -->
    <Transition name="fade">
      <div v-if="selectedBook" class="overlay" @click="closeDetails">
        <div class="detail-panel" @click.stop>
          <div class="detail-content">
            <div class="detail-header">
              <h2>Book Details</h2>
              <button class="close-btn" @click="closeDetails">&times;</button>
            </div>
            <div class="detail-body">
              <div class="detail-item">
                <label>ISBN:</label>
                <span>{{ selectedBook.isbn }}</span>
              </div>
              <div class="detail-item">
                <label>Title:</label>
                <span>{{ selectedBook.title }}</span>
              </div>
              <div v-if="selectedBook.title_ruby" class="detail-item">
                <label>Title Ruby:</label>
                <span>{{ selectedBook.title_ruby }}</span>
              </div>
              <div v-if="selectedBook.alt_title" class="detail-item">
                <label>Alternative Title:</label>
                <span>{{ selectedBook.alt_title }}</span>
              </div>
              <div v-if="selectedBook.alt_title_ruby" class="detail-item">
                <label>Alternative Title Ruby:</label>
                <span>{{ selectedBook.alt_title_ruby }}</span>
              </div>
              <div v-if="selectedBook.series" class="detail-item">
                <label>Series:</label>
                <span>{{ selectedBook.series }}</span>
              </div>
              <div v-if="selectedBook.series_ruby" class="detail-item">
                <label>Series Ruby:</label>
                <span>{{ selectedBook.series_ruby }}</span>
              </div>
              <div class="detail-item">
                <label>Authors:</label>
                <span>{{ selectedBook.creators }}</span>
              </div>
              <div class="detail-item">
                <label>Publisher:</label>
                <span>{{ selectedBook.publisher }}</span>
              </div>
              <div class="detail-item">
                <label>Publication Date:</label>
                <span>{{ selectedBook.date }}</span>
              </div>
              <div class="detail-item">
                <label>Price:</label>
                <span>¥{{ selectedBook.price.toLocaleString() }}</span>
              </div>
              <div class="detail-item">
                <label>Pages:</label>
                <span>{{ selectedBook.pages }}</span>
              </div>
              <div class="detail-item">
                <label>NDC:</label>
                <span>{{ selectedBook.ndc }}</span>
              </div>
              <div class="detail-item">
                <label>Location 1:</label>
                <input
                  v-model="selectedBook.location1"
                  placeholder="Enter location 1"
                  @change="updateBookLocation"
                />
              </div>
              <div class="detail-item">
                <label>Location 2:</label>
                <input
                  v-model="selectedBook.location2"
                  placeholder="Enter location 2"
                  @change="updateBookLocation"
                />
              </div>
              <div class="detail-item">
                <label>URL:</label>
                <a :href="selectedBook.url" target="_blank" rel="noopener">
                  {{ selectedBook.url }}
                </a>
              </div>
              <div class="detail-item">
                <label>Tags:</label>
                <div class="tags-container">
                  <span v-for="tag in selectedBook.tags" :key="tag.id" class="tag">
                    {{ tag.name }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Book } from '../../../types'

const isbn = ref('')
const location1 = ref('')
const location2 = ref('')
const books = ref<Book[]>([])
const selectedBook = ref<Book | null>(null)

const selectBook = (book: Book) => {
  selectedBook.value = book
}

const closeDetails = () => {
  selectedBook.value = null
}

const searchAndAddBook = async () => {
  if (!isbn.value) return

  try {
    const bookData = await window.electron.ipcRenderer.invoke('fetch-book-data', isbn.value)
    bookData.location1 = location1.value
    bookData.location2 = location2.value

    await window.electron.ipcRenderer.invoke('add-book', bookData)
    isbn.value = ''
    location1.value = ''
    location2.value = ''
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

.input-form {
  background: var(--color-background);
  padding: 20px 0;
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.input-row {
  display: flex;
  gap: 10px;
}

.input-row input {
  flex: 1;
  padding: 8px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 0.9em;
}

.input-row input:focus {
  outline: none;
  border-color: #4caf50;
}

button {
  padding: 8px 16px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  align-self: flex-end;
}

button:hover {
  background-color: #45a049;
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: stretch;
  justify-content: flex-end;
  z-index: 1000;
}

.detail-panel {
  background: var(--color-background);
  width: 100%;
  max-width: 500px;
  height: 100vh;
  overflow-y: auto;
  box-shadow: -2px 0 5px rgba(0, 0, 0, 0.1);
  border-left: 1px solid var(--color-border);
  transform: translateX(0);
  transition: transform 0.3s ease;
}

/* トランジションのアニメーション */
.fade-enter-active {
  transition: opacity 0.3s ease;
}

.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-from .detail-panel {
  transform: translateX(100%);
}

.fade-leave-to .detail-panel {
  transform: translateX(100%);
}

.input-form {
  background: var(--color-background);
  padding: 20px 0;
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.input-row {
  display: flex;
  gap: 10px;
}

.input-row input {
  flex: 1;
  padding: 8px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 0.9em;
}

.input-row input:focus {
  outline: none;
  border-color: #4caf50;
}

button {
  padding: 8px 16px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  align-self: flex-end;
}

button:hover {
  background-color: #45a049;
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.detail-panel {
  background: var(--color-background);
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.detail-content {
  padding: 24px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--color-border);
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--color-text);
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.close-btn:hover {
  background: var(--color-background-soft);
}

.detail-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
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

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item label {
  font-weight: 600;
  color: var(--ev-c-text-2);
  font-size: 0.9em;
}

.detail-item input {
  padding: 8px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 0.9em;
}

.detail-item input:focus {
  outline: none;
  border-color: #4caf50;
}

.detail-item a {
  color: #4caf50;
  text-decoration: none;
}

.detail-item a:hover {
  text-decoration: underline;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.delete-btn {
  background-color: #f44336;
}

.delete-btn:hover {
  background-color: #da190b;
}
</style>
