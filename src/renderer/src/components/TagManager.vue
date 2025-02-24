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
const bulkTagInput = ref('')

// const addedTags: string[] = []
// const duplicateTags: string[] = []

onMounted(loadAvailableTags)

async function loadAvailableTags() {
  try {
    availableTags.value = await window.electron.ipcRenderer.invoke('get-all-tags')
  } catch (error) {
    console.error('Error loading tags:', error)
  }
}

function isTagDuplicate(tagId: number | undefined): boolean {
  if (tagId === undefined) return false
  return props.bookTags.some((tag) => tag.id === tagId)
}

async function addNewTag() {
  const trimmedTagName = newTagName.value.trim()
  if (!trimmedTagName) return

  try {
    // 既存のタグを検索
    const existingTag = availableTags.value.find(
      (t) => t.name.toLowerCase() === trimmedTagName.toLowerCase()
    )

    if (existingTag && existingTag.id) {
      // 既存のタグが見つかった場合、それを再利用
      if (isTagDuplicate(existingTag.id)) {
        showToast(`タグ「${existingTag.name}」は既に登録されています`, 'info')
        newTagName.value = ''
        return
      }

      await window.electron.ipcRenderer.invoke('add-book-tag', {
        bookId: props.bookId,
        tagId: existingTag.id
      })
      showToast(`タグ「${existingTag.name}」を追加しました`, 'success')
    } else {
      // 新しいタグを作成
      const tag = await window.electron.ipcRenderer.invoke('add-tag', trimmedTagName)
      await window.electron.ipcRenderer.invoke('add-book-tag', {
        bookId: props.bookId,
        tagId: tag.id
      })
      showToast(`タグ「${tag.name}」を追加しました`, 'success')
    }

    newTagName.value = ''
    emit('update')
    await loadAvailableTags()
  } catch (error: any) {
    if (error?.message?.includes('SQLITE_CONSTRAINT: UNIQUE constraint failed')) {
      showToast('このタグは既に登録されています', 'info')
    } else {
      console.error('Error adding new tag:', error)
      showToast('タグの追加に失敗しました', 'error')
    }
  }
}

async function addExistingTag() {
  if (!selectedExistingTagId.value) return

  try {
    const tag = availableTags.value.find((t) => t.id === selectedExistingTagId.value)
    if (isTagDuplicate(selectedExistingTagId.value)) {
      showToast(`タグ「${tag?.name}」は既に登録されています`, 'info')
      selectedExistingTagId.value = ''
      return
    }
    await window.electron.ipcRenderer.invoke('add-book-tag', {
      bookId: props.bookId,
      tagId: selectedExistingTagId.value
    })
    showToast(`タグ「${tag?.name}」を追加しました`, 'success')
    selectedExistingTagId.value = ''
    emit('update')
  } catch (error: any) {
    if (error?.message?.includes('SQLITE_CONSTRAINT: UNIQUE constraint failed')) {
      showToast('このタグは既に登録されています', 'info')
    } else {
      console.error('Error adding existing tag:', error)
      showToast('タグの追加に失敗しました', 'error')
    }
  }
}

async function addBulkTags() {
  if (!bulkTagInput.value.trim()) return

  const tagNames = bulkTagInput.value
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag)
  const addedTags: string[] = []
  const duplicateTags: string[] = []

  for (const tagName of tagNames) {
    try {
      // 既存のタグを検索
      const existingTag = availableTags.value.find(
        (t) => t.name.toLowerCase() === tagName.toLowerCase()
      )

      if (existingTag && existingTag.id) {
        // 既存のタグが見つかった場合、それを再利用
        if (isTagDuplicate(existingTag.id)) {
          duplicateTags.push(existingTag.name)
          continue
        }

        await window.electron.ipcRenderer.invoke('add-book-tag', {
          bookId: props.bookId,
          tagId: existingTag.id
        })
        addedTags.push(existingTag.name)
      } else {
        // 新しいタグを作成
        const tag = await window.electron.ipcRenderer.invoke('add-tag', tagName)
        if (tag && tag.id && !isTagDuplicate(tag.id)) {
          await window.electron.ipcRenderer.invoke('add-book-tag', {
            bookId: props.bookId,
            tagId: tag.id
          })
          addedTags.push(tag.name)
        } else {
          duplicateTags.push(tagName)
        }
      }
    } catch (error: any) {
      if (error?.message?.includes('SQLITE_CONSTRAINT: UNIQUE constraint failed')) {
        duplicateTags.push(tagName)
      } else {
        console.error(`Error adding tag ${tagName}:`, error)
      }
    }
  }

  if (addedTags.length > 0) {
    showToast(`タグを追加しました: ${addedTags.join(', ')}`, 'success')
  }
  if (duplicateTags.length > 0) {
    showToast(`既に登録済みのタグ: ${duplicateTags.join(', ')}`, 'info')
  }

  bulkTagInput.value = ''
  emit('update')
  await loadAvailableTags()
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
    <div class="bulk-tag-input-container">
      <input
        v-model="bulkTagInput"
        class="tag-input"
        placeholder="複数タグを一括追加（カンマ区切り）"
        @keyup.enter="addBulkTags"
      />
      <button class="bulk-add-btn" @click="addBulkTags">一括追加</button>
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

.tag-input-container,
.bulk-tag-input-container {
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

.bulk-add-btn {
  padding: 6px 12px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--ev-c-gray-1);
  cursor: pointer;
}

.bulk-add-btn:hover {
  background: var(--ev-c-gray-2);
}
</style>
