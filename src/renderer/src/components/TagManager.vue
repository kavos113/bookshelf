<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Tag } from '../../../types'
import { showToast } from '../utils/toastUtils'

const props = defineProps<{
  bookId: number
  bookTags: Tag[]
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

async function addNewTag() {
  if (!newTagName.value.trim()) return

  try {
    const tag = await window.electron.ipcRenderer.invoke('add-tag', newTagName.value.trim())
    await window.electron.ipcRenderer.invoke('add-book-tag', {
      bookId: props.bookId,
      tagId: tag.id
    })
    showToast(`タグ「${tag.name}」を追加しました`, 'success')
    newTagName.value = ''
    emit('update')
    await loadAvailableTags()
  } catch (error) {
    console.error('Error adding new tag:', error)
    showToast('タグの追加に失敗しました', 'error')
  }
}

async function addExistingTag() {
  if (!selectedExistingTagId.value) return

  try {
    const tag = availableTags.value.find((t) => t.id === selectedExistingTagId.value)
    await window.electron.ipcRenderer.invoke('add-book-tag', {
      bookId: props.bookId,
      tagId: selectedExistingTagId.value
    })
    showToast(`タグ「${tag?.name}」を追加しました`, 'success')
    selectedExistingTagId.value = ''
    emit('update')
  } catch (error) {
    console.error('Error adding existing tag:', error)
    showToast('タグの追加に失敗しました', 'error')
  }
}

async function removeTag(tagId: number) {
  try {
    const tag = props.bookTags.find((t) => t.id === tagId)
    await window.electron.ipcRenderer.invoke('remove-book-tag', {
      bookId: props.bookId,
      tagId
    })
    showToast(`タグ「${tag?.name}」を削除しました`, 'success')
    emit('update')
  } catch (error) {
    console.error('Error removing tag:', error)
    showToast('タグの削除に失敗しました', 'error')
  }
}
</script>

<template>
  <div class="tag-manager">
    <div class="tags-container">
      <span v-for="tag in bookTags" :key="tag.id">
        <span class="tag">
          {{ tag.name }}
          <button v-if="tag.id !== undefined" class="tag-remove-btn" @click="removeTag(tag.id)">
            ×
          </button>
        </span>
      </span>
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
</style>
