<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Book } from '../../../types'
import BookDetails from './BookDetails.vue'
import BookInputForm from './BookInputForm.vue'
import BookTable from './BookTable.vue'
import Search from './Search.vue'
import BulkTagManager from './BulkTagManager.vue'
import { sortBooks, searchBooks, type SortConfig, type SearchConfig } from '../utils/bookUtils'
import { showToast } from '../utils/toastUtils'

const books = ref<Book[]>([])
const selectedBook = ref<Book | null>(null)
const sortConfig = ref<SortConfig>({
  key: 'title',
  order: 'asc'
})
const searchConfig = ref<SearchConfig>({
  title: '',
  publisher: '',
  creators: '',
  tagIds: []
})

const filteredBooks = computed(() => {
  const searchedBooks = searchBooks(books.value, searchConfig.value)
  return sortBooks(searchedBooks, sortConfig.value)
})

const updateSort = (config: SortConfig) => {
  sortConfig.value = config
}

const updateSearch = (config: SearchConfig) => {
  searchConfig.value = config
}

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
    showToast(`「${bookData.title}」を追加しました`, 'success')
    fetchBooks()
  } catch (error) {
    console.error('Error processing book data:', error)
    showToast('本の追加に失敗しました', 'error')
  }
}

const fetchBooks = async () => {
  books.value = await window.electron.ipcRenderer.invoke('get-books')
}

const deleteBook = async (id: number) => {
  if (selectedBook.value?.id === id) {
    selectedBook.value = null
  }
  try {
    await window.electron.ipcRenderer.invoke('delete-book', id)
    showToast('本を削除しました', 'success')
    fetchBooks()
  } catch (error) {
    console.error('Error deleting book:', error)
    showToast('本の削除に失敗しました', 'error')
  }
}

const updateBookLocation = async (location1: string, location2: string) => {
  if (!selectedBook.value) return
  try {
    await window.electron.ipcRenderer.invoke('update-book-location', {
      id: selectedBook.value.id,
      location1,
      location2
    })
    await fetchBooks()
    const currentId = selectedBook.value.id
    if (currentId) {
      selectedBook.value = books.value.find((b) => b.id === currentId) ?? null
    }
    showToast('場所情報を更新しました', 'success')
  } catch (error) {
    console.error('Error updating book location:', error)
    showToast('場所情報の更新に失敗しました', 'error')
  }
}

const selectedBookIds = ref<number[]>([])

const handleSelectionChange = (ids: number[]) => {
  selectedBookIds.value = ids
}

const handleBulkTagUpdate = async () => {
  await fetchBooks()
}

onMounted(fetchBooks)
</script>

<template>
  <div class="books-container">
    <div class="content-panel">
      <h1>Books</h1>
      <BookInputForm @submit="searchAndAddBook" />
      <Search @update="updateSearch" />
      <BulkTagManager
        :selected-book-ids="selectedBookIds"
        :books="books"
        @update="handleBulkTagUpdate"
      />
      <BookTable
        :books="filteredBooks"
        :selected-book-id="selectedBook?.id"
        @sort="updateSort"
        @select="selectBook"
        @delete="deleteBook"
        @selection-change="handleSelectionChange"
      />
    </div>

    <BookDetails
      :book="selectedBook"
      @close="closeDetails"
      @update-location="updateBookLocation"
      @update="fetchBooks"
    />
  </div>
</template>

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
</style>
