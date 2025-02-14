import { ref } from 'vue'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

const toasts = ref<Toast[]>([])
let nextId = 0

export function showToast(message: string, type: Toast['type'] = 'info') {
  const id = nextId++
  const toast: Toast = { id, message, type }
  toasts.value.push(toast)
  setTimeout(() => removeToast(id), 3000)
}

function removeToast(id: number) {
  const index = toasts.value.findIndex((t) => t.id === id)
  if (index !== -1) {
    toasts.value.splice(index, 1)
  }
}

export function useToast() {
  return {
    toasts,
    showToast,
    removeToast
  }
}
