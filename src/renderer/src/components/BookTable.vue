<script setup lang="ts">
import { ref } from 'vue'
import { Book } from '../../../types'
import { SortConfig } from '../utils/bookUtils'

const props = defineProps<{
  books: Book[]
  selectedBookId?: number
}>()

const emit = defineEmits<{
  (e: 'sort', config: SortConfig): void
  (e: 'select', book: Book): void
  (e: 'delete', id: number): void
}>()

const sortConfig = ref<SortConfig>({
  key: 'title',
  order: 'asc'
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
  emit('sort', sortConfig.value)
}
</script>

<template>
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
          v-for="book in books"
          :key="book.id"
          :class="{ selected: selectedBookId === book.id }"
          @click="$emit('select', book)"
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
            <button class="delete-btn" @click.stop="$emit('delete', book.id!)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
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
  cursor: pointer;
  user-select: none;
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

.sort-indicator {
  margin-left: 4px;
  display: inline-block;
  font-size: 0.8em;
}
</style>
