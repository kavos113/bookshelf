<template>
  <div>
    <h1>Books</h1>
    <form @submit.prevent="addBook">
      <input v-model="title" placeholder="Title" required />
      <input v-model="author" placeholder="Author" required />
      <input v-model="publishedDate" placeholder="Published Date" required />
      <button type="submit">Add Book</button>
    </form>
    <ul>
      <li v-for="book in books" :key="book.id">
        {{ book.title }} by {{ book.author }} ({{ book.published_date }})
        <button @click="deleteBook(book.id)">Delete</button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const title = ref('')
const author = ref('')
const publishedDate = ref('')
const books = ref([])

const fetchBooks = async () => {
  books.value = await window.electron.ipcRenderer.invoke('get-books')
}

const addBook = async () => {
  await window.electron.ipcRenderer.invoke('add-book', {
    title: title.value,
    author: author.value,
    published_date: publishedDate.value
  })
  title.value = ''
  author.value = ''
  publishedDate.value = ''
  fetchBooks()
}

const deleteBook = async (id: number) => {
  await window.electron.ipcRenderer.invoke('delete-book', id)
  fetchBooks()
}

onMounted(fetchBooks)
</script>

<style scoped>
/* Add your styles here */
</style>
