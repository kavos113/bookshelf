<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Tag } from '../../../types'

const props = defineProps<{
  selectedTags: Tag[]
}>()

const emit = defineEmits<{
  (e: 'add-tag', tag: Tag): void
  (e: 'remove-tag', tagId: number): void
}>()

const availableTags = ref<Tag[]>([])
const selectedTagId = ref<number | ''>('')

async function loadAvailableTags() {
  try {
    availableTags.value = await window.electron.ipcRenderer.invoke('get-all-tags')
  } catch (error) {
    console.error('Error loading tags:', error)
  }
}

function addTag() {
  if (!selectedTagId.value) return

  const tag = availableTags.value.find((t) => t.id === selectedTagId.value)
  if (tag) {
    emit('add-tag', tag)
    selectedTagId.value = ''
  }
}

onMounted(loadAvailableTags)
</script>

<template>
  <div class="tag-search">
    <select v-model="selectedTagId" class="tag-select" @change="addTag" @click="loadAvailableTags">
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
          @click="tag.id && $emit('remove-tag', tag.id)"
        >
          ×
        </button>
      </span>
    </div>
  </div>
</template>

<style scoped>
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
</style>
