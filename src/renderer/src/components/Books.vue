<template>
  <div>
    <h1>Books</h1>
    <form @submit.prevent="searchAndAddBook">
      <input v-model="isbn" placeholder="ISBN" required />
      <button type="submit">Add Book</button>
    </form>
    <!-- 確認ダイアログ -->
    <dialog ref="confirmDialog" class="confirm-dialog">
      <p>反復処理を続行しますか?</p>
      <div class="dialog-buttons">
        <button @click="onConfirmContinue">続行</button>
        <button @click="onConfirmCancel">キャンセル</button>
      </div>
    </dialog>
    <ul>
      <li v-for="book in books" :key="book.id">
        {{ book.title }} by {{ book.creators }} ({{ book.date }})
        <button @click="deleteBook(book.id!)">Delete</button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Book } from '../../../types'

const isbn = ref('')
const books = ref<Book[]>([])
const confirmDialog = ref<HTMLDialogElement | null>(null)
const processingCallback = ref<(() => void) | null>(null)

const showConfirmDialog = (callback: () => void) => {
  processingCallback.value = callback
  confirmDialog.value?.showModal()
}

const onConfirmContinue = () => {
  confirmDialog.value?.close()
  processingCallback.value?.()
  processingCallback.value = null
}

const onConfirmCancel = () => {
  confirmDialog.value?.close()
  processingCallback.value = null
  isbn.value = ''
}

const searchAndAddBook = async () => {
  if (!isbn.value) return

  showConfirmDialog(async () => {
    try {
      const bookData = await window.electron.ipcRenderer.invoke('fetch-book-data', isbn.value)
      await window.electron.ipcRenderer.invoke('add-book', bookData)
      isbn.value = ''
      fetchBooks()
    } catch (error) {
      console.error('Error processing book data:', error)
    }
  })
}

const fetchBooks = async () => {
  books.value = await window.electron.ipcRenderer.invoke('get-books')
}

const deleteBook = async (id: number) => {
  await window.electron.ipcRenderer.invoke('delete-book', id)
  fetchBooks()
}

onMounted(fetchBooks)
</script>

<style scoped>
form {
  display: flex;
  gap: 10px;
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
}

input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

button {
  padding: 8px 16px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #45a049;
}

.confirm-dialog {
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #ccc;
}

.dialog-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
}

.dialog-buttons button {
  min-width: 100px;
}

ul {
  list-style: none;
  padding: 0;
  max-width: 500px;
  margin: 20px auto;
}

li {
  padding: 10px;
  border: 1px solid #ddd;
  margin-bottom: 10px;
  border-radius: 4px;
}

li button {
  background-color: #f44336;
  float: right;
}

li button:hover {
  background-color: #da190b;
}
</style>
