<script setup lang="ts">
import { ref } from 'vue'

const isbn = ref('')
const location1 = ref('')
const location2 = ref('')

const emit = defineEmits<{
  (e: 'submit', data: { isbn: string; location1: string; location2: string }): void
}>()

function submit() {
  if (!isbn.value) return
  emit('submit', {
    isbn: isbn.value,
    location1: location1.value,
    location2: location2.value
  })
  isbn.value = ''
  location1.value = ''
  location2.value = ''
}
</script>

<template>
  <div class="input-form">
    <div class="input-row">
      <input v-model="isbn" placeholder="ISBN" required @keyup.enter="submit" />
      <input v-model="location1" placeholder="Location 1" @keyup.enter="submit" />
      <input v-model="location2" placeholder="Location 2" @keyup.enter="submit" />
    </div>
    <button @click="submit">Add Book</button>
  </div>
</template>

<style scoped>
.input-form {
  background: var(--color-background);
  padding: 20px 0;
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.input-row {
  display: flex;
  gap: 10px;
}

.input-row input {
  flex: 1;
  padding: 8px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 0.9em;
}

.input-row input:focus {
  outline: none;
  border-color: #4caf50;
}

button {
  padding: 8px 16px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  align-self: flex-end;
}

button:hover {
  background-color: #45a049;
}
</style>
