<template>
  <div class="books-container">
    <div class="content-panel">
      <h1>Books</h1>
      <BookInputForm @submit="searchAndAddBook" />

      <!-- 検索フォーム -->
      <div class="search-form">
        <div class="text-search">
          <input
            v-model="searchConfig.title"
            placeholder="Search by title..."
            @input="updateFilteredBooks"
          />
          <input
            v-model="searchConfig.publisher"
            placeholder="Search by publisher..."
            @input="updateFilteredBooks"
          />
          <input
            v-model="searchConfig.creators"
            placeholder="Search by authors..."
            @input="updateFilteredBooks"
          />
        </div>

        <!-- タグ検索 -->
        <div class="tag-search">
          <select
            v-model="selectedTagId"
            class="tag-select"
            @change="addSearchTag"
            @click="loadAvailableTags"
          >
            <option value="">タグを選択</option>
            <option v-for="tag in availableTags" :key="tag.id" :value="tag.id">
              {{ tag.name }}
            </option>
          </select>
          <div class="tags-container">
            <span v-for="tag in selectedTags" :key="tag.id" class="tag">
              {{ tag.name }}
              <button
                v-if="tag.id !== undefined"
                class="tag-remove-btn"
                @click="tag.id && removeSearchTag(tag.id)"
              >
                ×
              </button>
            </span>
          </div>
        </div>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th @click="sortBy('title')">
                Title
                <span v-if="sortConfig.key === 'title'" class="sort-indicator">
                  {{ sortConfig.order === 'asc' ? '↑' : '↓' }}
                </span>
              </th>
              <th @click="sortBy('creators')">
                Author
                <span v-if="sortConfig.key === 'creators'" class="sort-indicator">
                  {{ sortConfig.order === 'asc' ? '↑' : '↓' }}
                </span>
              </th>
              <th @click="sortBy('ndc')">
                NDC
                <span v-if="sortConfig.key === 'ndc'" class="sort-indicator">
                  {{ sortConfig.order === 'asc' ? '↑' : '↓' }}
                </span>
              </th>
              <th @click="sortBy('publisher')">
                Publisher
                <span v-if="sortConfig.key === 'publisher'" class="sort-indicator">
                  {{ sortConfig.order === 'asc' ? '↑' : '↓' }}
                </span>
              </th>
              <th>Tags</th>
              <th @click="sortBy('location1')">
                Location 1
                <span v-if="sortConfig.key === 'location1'" class="sort-indicator">
                  {{ sortConfig.order === 'asc' ? '↑' : '↓' }}
                </span>
              </th>
              <th @click="sortBy('location2')">
                Location 2
                <span v-if="sortConfig.key === 'location2'" class="sort-indicator">
                  {{ sortConfig.order === 'asc' ? '↑' : '↓' }}
                </span>
              </th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="book in filteredBooks"
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

    <BookDetails
      :book="selectedBook"
      @close="closeDetails"
      @update-location="updateBookLocation"
      @update="fetchBooks"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Book, Tag } from '../../../types'
import BookDetails from './BookDetails.vue'
import BookInputForm from './BookInputForm.vue'
import { sortBooks, searchBooks, type SortConfig, type SearchConfig } from '../utils/bookUtils'
import { debounce } from '../utils/debounceUtils'
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

const availableTags = ref<Tag[]>([])
const selectedTags = ref<Tag[]>([])
const selectedTagId = ref<number | ''>('')

const filteredBooks = computed(() => {
  const searchedBooks = searchBooks(books.value, searchConfig.value)
  return sortBooks(searchedBooks, sortConfig.value)
})

const sortBy = (key: SortConfig['key']) => {
  if (sortConfig.value.key === key) {
    sortConfig.value.order = sortConfig.value.order === 'asc' ? 'desc' : 'asc'
  } else {
    sortConfig.value = {
      key,
      order: 'asc'
    }
  }
}

const updateFilteredBooks = debounce(() => {
  // 検索時の処理をdebounceする（300ms）
}, 300)

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

async function loadAvailableTags() {
  try {
    availableTags.value = await window.electron.ipcRenderer.invoke('get-all-tags')
  } catch (error) {
    console.error('Error loading tags:', error)
  }
}

function addSearchTag() {
  if (!selectedTagId.value) return

  const tag = availableTags.value.find((t) => t.id === selectedTagId.value)
  if (tag && !selectedTags.value.some((t) => t.id === tag.id) && tag.id !== undefined) {
    selectedTags.value.push(tag)
    const validTagIds = selectedTags.value
      .map((t) => t.id!)
      .filter((id): id is number => id !== undefined)
    searchConfig.value.tagIds = validTagIds
    selectedTagId.value = ''
  }
}

function removeSearchTag(tagId: number) {
  selectedTags.value = selectedTags.value.filter((t) => t.id !== tagId)
  const validTagIds = selectedTags.value
    .map((t) => t.id!)
    .filter((id): id is number => id !== undefined)
  searchConfig.value.tagIds = validTagIds
}

onMounted(async () => {
  await Promise.all([fetchBooks(), loadAvailableTags()])
})
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

td {
  font-size: 0.8em;
  padding: 0 12px;
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

.search-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 20px 0;
}

.text-search {
  display: flex;
  gap: 12px;
}

.text-search input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 0.9em;
}

.tag-search {
  display: flex;
  gap: 12px;
  align-items: center;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex: 1;
}

.tag {
  position: relative;
  display: inline-block;
  padding: 2px 24px 2px 8px;
  background: var(--ev-c-gray-1);
  border-radius: 12px;
  font-size: 0.8em;
}

.tag-remove-btn {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--color-text);
  cursor: pointer;
  padding: 0 4px;
  font-size: 12px;
}

.tag-remove-btn:hover {
  color: #f44336;
}

.tag-select {
  min-width: 150px;
  padding: 6px 12px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 0.9em;
}

th {
  cursor: pointer;
  user-select: none;
  position: relative;
}

th:hover {
  background: var(--color-background-mute);
}

.sort-indicator {
  margin-left: 4px;
  display: inline-block;
  font-size: 0.8em;
}
</style>
