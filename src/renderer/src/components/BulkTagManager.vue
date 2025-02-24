<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Tag, Book } from '../../../types'
import { showToast } from '../utils/toastUtils'

const props = defineProps<{
  selectedBookIds: number[]
  books: Book[]
}>()

const emit = defineEmits<{
  (e: 'update'): void
}>()

const newTagName = ref('')
const selectedExistingTagId = ref<number | ''>('')
const availableTags = ref<Tag[]>([])

onMounted(loadAvailableTags)

async function loadAvailableTags() {
  try {
    availableTags.value = await window.electron.ipcRenderer.invoke('get-all-tags')
  } catch (error) {
    console.error('Error loading tags:', error)
  }
}

async function updateBookTags(bookId: number): Promise<void> {
  try {
    const updatedTags = await window.electron.ipcRenderer.invoke('get-tags-by-book-id', bookId)
    const book = props.books.find((b) => b.id === bookId)
    if (book) {
      book.tags = updatedTags
    }
  } catch (error) {
    console.error(`Error updating tags for book ${bookId}:`, error)
  }
}

async function addTagToBooks(tagId: number, tagName: string) {
  let successCount = 0
  let alreadyAddedCount = 0
  const processedBookIds = new Set<number>()

  for (const bookId of props.selectedBookIds) {
    try {
      const book = props.books.find((b) => b.id === bookId)
      if (!book) continue

      // 既にタグが付いているか確認
      if (book.tags.some((t) => t.id === tagId)) {
        alreadyAddedCount++
        continue
      }

      await window.electron.ipcRenderer.invoke('add-book-tag', { bookId, tagId })
      await updateBookTags(bookId)
      processedBookIds.add(bookId)
      successCount++
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('SQLITE_CONSTRAINT: UNIQUE constraint failed')
      ) {
        alreadyAddedCount++
      } else {
        console.error(`Error adding tag to book ${bookId}:`, error)
      }
    }
  }

  if (successCount > 0) {
    showToast(`タグ「${tagName}」を${successCount}冊の本に追加しました`, 'success')
  }
  if (alreadyAddedCount > 0) {
    showToast(`${alreadyAddedCount}冊の本は既にタグが追加されています`, 'info')
  }

  if (successCount > 0) {
    emit('update')
  }
}

async function addNewTag() {
  if (!newTagName.value.trim()) return

  try {
    const tag = await window.electron.ipcRenderer.invoke('add-tag', newTagName.value.trim())
    if (tag && tag.id !== undefined) {
      await addTagToBooks(tag.id, tag.name)
      newTagName.value = ''
      await loadAvailableTags()
    }
  } catch (error) {
    console.error('Error adding new tag:', error)
    showToast('タグの追加に失敗しました', 'error')
  }
}

async function addExistingTag() {
  if (!selectedExistingTagId.value) return

  try {
    const tag = availableTags.value.find((t) => t.id === selectedExistingTagId.value)
    if (tag && tag.id !== undefined) {
      await addTagToBooks(tag.id, tag.name)
    }
    selectedExistingTagId.value = ''
  } catch (error) {
    console.error('Error adding existing tag:', error)
    showToast('タグの追加に失敗しました', 'error')
  }
}
</script>

<template>
  <div v-if="selectedBookIds.length > 0" class="bulk-tag-manager">
    <div class="header">
      <h3>{{ selectedBookIds.length }}冊の本を選択中</h3>
    </div>
    <div class="tag-input-container">
      <input
        v-model="newTagName"
        class="tag-input"
        placeholder="新しいタグ(Enterで追加)"
        @keyup.enter="addNewTag"
      />
      <select v-model="selectedExistingTagId" class="tag-select" @change="addExistingTag">
        <option value="">以下から追加</option>
        <option v-for="tag in availableTags" :key="tag.id" :value="tag.id">
          {{ tag.name }}
        </option>
      </select>
    </div>
  </div>
</template>

<style scoped>
.bulk-tag-manager {
  margin: 16px 0;
  padding: 16px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background-soft);
}

.header {
  margin-bottom: 12px;
}

.header h3 {
  margin: 0;
  font-size: 1em;
  color: var(--color-text);
}

.tag-input-container {
  display: flex;
  gap: 8px;
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
</style>
