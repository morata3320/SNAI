import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'warn' | 'info'

export interface Toast {
  id: number
  type: ToastType
  msg: string
}

// Estado global singleton — compartido entre todos los componentes
const toasts = ref<Toast[]>([])
let _id = 0

export function useToast() {
  function add(msg: string, type: ToastType, ms = 3500) {
    const id = ++_id
    toasts.value.push({ id, type, msg })
    setTimeout(() => remove(id), ms)
  }

  function remove(id: number) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  return {
    toasts,
    remove,
    success: (msg: string) => add(msg, 'success'),
    error:   (msg: string) => add(msg, 'error'),
    warn:    (msg: string) => add(msg, 'warn'),
    info:    (msg: string) => add(msg, 'info'),
  }
}
