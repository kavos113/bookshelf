<script setup lang="ts">
import { ref } from 'vue'
import { Tag } from '../../../types'
import { SearchConfig } from '../utils/bookUtils'
import { debounce } from '../utils/debounceUtils'
import TagSelector from './TagSelector.vue'

const searchConfig = ref<SearchConfig>({
  title: '',
  publisher: '',
  creators: '',
  tagIds: []
})

const selectedTags = ref<Tag[]>([])

const updateSearch = debounce(() => {
  emit('update', searchConfig.value)
}, 300)

const emit = defineEmits<{
  (e: 'update', config: SearchConfig): void
}>()

function addSearchTag(tag: Tag) {
  if (!selectedTags.value.some((t) => t.id === tag.id) && tag.id !== undefined) {
    selectedTags.value.push(tag)
    updateTagIds()
  }
}

function removeSearchTag(tagId: number) {
  selectedTags.value = selectedTags.value.filter((t) => t.id !== tagId)
  updateTagIds()
}

function updateTagIds() {
  const validTagIds = selectedTags.value
    .map((t) => t.id!)
    .filter((id): id is number => id !== undefined)
  searchConfig.value.tagIds = validTagIds
  emit('update', searchConfig.value)
}
</script>

<template>
  <div class="search-form">
    <div class="text-search">
      <input v-model="searchConfig.title" placeholder="Search by title..." @input="updateSearch" />
      <input
        v-model="searchConfig.publisher"
        placeholder="Search by publisher..."
        @input="updateSearch"
      />
      <input
        v-model="searchConfig.creators"
        placeholder="Search by authors..."
        @input="updateSearch"
      />
    </div>
    <TagSelector
      :selected-tags="selectedTags"
      @add-tag="addSearchTag"
      @remove-tag="removeSearchTag"
    />
  </div>
</template>

<style scoped>
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
</style>
