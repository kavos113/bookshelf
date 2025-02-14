<template>
  <Transition name="fade">
    <div v-if="book" class="overlay" @click="$emit('close')"></div>
  </Transition>
  <Transition name="slide">
    <div v-if="book" class="detail-panel" @click.stop>
      <div class="detail-content">
        <div class="detail-header">
          <div>
            <h2 class="detail-title">{{ book.title }}</h2>
            <p>{{ book.alt_title }}</p>
          </div>
          <button class="close-btn" @click="$emit('close')">&times;</button>
        </div>
        <div class="detail-body">
          <div class="detail-item">
            <label>ISBN:</label>
            <span>{{ book.isbn }}</span>
          </div>
          <div v-if="book.title_ruby" class="detail-item">
            <label>Title Ruby:</label>
            <span>{{ book.title_ruby }}</span>
          </div>
          <div v-if="book.alt_title_ruby" class="detail-item">
            <label>Alternative Title Ruby:</label>
            <span>{{ book.alt_title_ruby }}</span>
          </div>
          <div v-if="book.series" class="detail-item">
            <label>Series:</label>
            <span>{{ book.series }}</span>
          </div>
          <div v-if="book.series_ruby" class="detail-item">
            <label>Series Ruby:</label>
            <span>{{ book.series_ruby }}</span>
          </div>
          <div class="detail-item">
            <label>Authors:</label>
            <span>{{ book.creators }}</span>
          </div>
          <div class="detail-item">
            <label>Publisher:</label>
            <span>{{ book.publisher }}</span>
          </div>
          <div class="detail-item">
            <label>Publication Date:</label>
            <span>{{ book.date }}</span>
          </div>
          <div class="detail-item">
            <label>Price:</label>
            <span>¥{{ book.price.toLocaleString() }}</span>
          </div>
          <div class="detail-item">
            <label>Pages:</label>
            <span>{{ book.pages }}</span>
          </div>
          <div class="detail-item">
            <label>NDC:</label>
            <span>{{ book.ndc }}</span>
          </div>
          <div class="detail-item">
            <label>Location 1:</label>
            <input
              v-model="localLocation1"
              placeholder="Enter location 1"
              @change="updateLocation"
            />
          </div>
          <div class="detail-item">
            <label>Location 2:</label>
            <input
              v-model="localLocation2"
              placeholder="Enter location 2"
              @change="updateLocation"
            />
          </div>
          <div class="detail-item">
            <label>URL:</label>
            <a :href="book.url" target="_blank" rel="noopener">
              {{ book.url }}
            </a>
          </div>
          <div class="detail-item">
            <label>Tags:</label>
            <div class="tags-container">
              <span v-for="tag in book.tags" :key="tag.id">
                <span class="tag">
                  {{ tag.name }}
                  <button
                    v-if="tag.id !== undefined"
                    class="tag-remove-btn"
                    @click="removeTag(tag.id)"
                  >
                    ×
                  </button>
                </span>
              </span>
            </div>
            <div class="tag-input-container">
              <input
                class="tag-input"
                placeholder="新しいタグ(Enterで追加)"
                v-model="newTagName"
                @keyup.enter="addNewTag"
              />
              <select v-model="selectedExistingTagId" class="tag-select">
                <option value="">以下から追加</option>
                <option v-for="tag in availableTags" :key="tag.id" :value="tag.id">
                  {{ tag.name }}
                </option>
              </select>
              <button
                class="add-tag-btn"
                :disabled="!selectedExistingTagId"
                @click="addExistingTag"
              >
                追加
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Book, Tag } from '../../../types'

const props = defineProps<{
  book: Book | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'update-location', location1: string, location2: string): void
  (e: 'update'): void
}>()

const newTagName = ref('')
const selectedExistingTagId = ref<number | ''>('')
const availableTags = ref<Tag[]>([])

const localLocation1 = ref('')
const localLocation2 = ref('')

watch(
  () => props.book,
  (newBook) => {
    if (newBook) {
      localLocation1.value = newBook.location1 || ''
      localLocation2.value = newBook.location2 || ''
    }
  },
  { immediate: true }
)

const updateLocation = () => {
  emit('update-location', localLocation1.value, localLocation2.value)
}

onMounted(async () => {
  await loadAvailableTags()
})

async function loadAvailableTags() {
  try {
    availableTags.value = await window.electron.ipcRenderer.invoke('get-all-tags')
  } catch (error) {
    console.error('Error loading tags:', error)
  }
}

async function addNewTag() {
  if (!props.book || !newTagName.value.trim()) return

  try {
    const tag = await window.electron.ipcRenderer.invoke('add-tag', newTagName.value.trim())
    await window.electron.ipcRenderer.invoke('add-book-tag', {
      bookId: props.book.id,
      tagId: tag.id
    })
    newTagName.value = ''
    emit('update')
    await loadAvailableTags()
    console.log(availableTags.value)
  } catch (error) {
    console.error('Error adding new tag:', error)
  }
}

async function addExistingTag() {
  if (!props.book || !selectedExistingTagId.value) return

  try {
    await window.electron.ipcRenderer.invoke('add-book-tag', {
      bookId: props.book.id,
      tagId: selectedExistingTagId.value
    })
    selectedExistingTagId.value = ''
    emit('update')
  } catch (error) {
    console.error('Error adding existing tag:', error)
  }
}

async function removeTag(tagId: number) {
  if (!props.book) return

  try {
    await window.electron.ipcRenderer.invoke('remove-book-tag', {
      bookId: props.book.id,
      tagId
    })
    emit('update')
  } catch (error) {
    console.error('Error removing tag:', error)
  }
}
</script>

<style scoped>
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
  position: fixed;
  top: 0;
  right: 0;
  z-index: 1001;
  background: var(--color-background);
  width: 100%;
  max-width: 50%;
  height: 100vh;
  overflow-y: auto;
  box-shadow: -2px 0 5px rgba(0, 0, 0, 0.1);
  border-left: 1px solid var(--color-border);
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

detail-item a:hover {
  text-decoration: underline;
}

.detail-title {
  margin-top: 1em;
  font-size: 1.7em;
  font-weight: 600;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag {
  position: relative;
  padding-right: 24px;
  display: inline-block;
  padding: 2px 8px;
  padding-right: 20px;
  margin: 2px;
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

.tag-input-container {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.tag-input,
.tag-select {
  padding: 6px 12px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 0.9em;
}

.tag-input {
  flex: 1;
}

.tag-select {
  min-width: 150px;
}

.add-tag-btn {
  padding: 6px 12px;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  cursor: pointer;
}

.add-tag-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.add-tag-btn:not(:disabled):hover {
  background: var(--color-background-mute);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slite-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
