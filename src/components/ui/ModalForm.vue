<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { Save, X } from '@lucide/vue'

const props = withDefaults(defineProps<{
  show: boolean
  title: string
  eyebrow?: string
  size?: 'sm' | 'md' | 'lg'
  saveLabel?: string
  saving?: boolean
  saveDisabled?: boolean
  variant?: 'primary' | 'danger'
}>(), {
  eyebrow: '',
  size: 'md',
  saveLabel: 'Guardar',
  saving: false,
  saveDisabled: false,
  variant: 'primary',
})

const emit = defineEmits<{
  close: []
  save: []
}>()

const modalRef = ref<HTMLElement | null>(null)
let focoPrevio: HTMLElement | null = null

function enfocables(): HTMLElement[] {
  const root = modalRef.value
  if (!root) return []
  return Array.from(root.querySelectorAll<HTMLElement>(
    'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
  ))
}

function alTeclear(evento: KeyboardEvent): void {
  if (!props.show) return
  if (evento.key === 'Escape') {
    evento.preventDefault()
    emit('close')
    return
  }
  if (evento.key !== 'Tab') return

  const items = enfocables()
  if (!items.length) return
  const primero = items[0]
  const ultimo = items[items.length - 1]
  const activo = document.activeElement as HTMLElement | null

  if (evento.shiftKey && activo === primero) {
    evento.preventDefault()
    ultimo.focus()
  } else if (!evento.shiftKey && activo === ultimo) {
    evento.preventDefault()
    primero.focus()
  }
}

watch(() => props.show, async (visible) => {
  if (visible) {
    focoPrevio = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'
    await nextTick()
    const items = enfocables()
    const primerCampo = items.find((el) => ['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName)) ?? items[0]
    primerCampo?.focus()
  } else {
    document.body.style.overflow = ''
    await nextTick()
    focoPrevio?.focus()
    focoPrevio = null
  }
})

onMounted(() => window.addEventListener('keydown', alTeclear))
onUnmounted(() => {
  window.removeEventListener('keydown', alTeclear)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="backdrop" @click.self="emit('close')">
      <div
        ref="modalRef"
        class="modal"
        :class="size"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
      >
        <div class="modal-head">
          <div>
            <p v-if="eyebrow" class="eyebrow">{{ eyebrow }}</p>
            <h3>{{ title }}</h3>
          </div>
          <button class="x" type="button" aria-label="Cerrar" title="Cerrar" @click="emit('close')">
            <X :size="18" />
          </button>
        </div>

        <div class="modal-body">
          <slot />
        </div>

        <div class="modal-foot">
          <slot name="footer-left" />
          <button class="btn btn-ghost" type="button" :disabled="saving" @click="emit('close')">
            <X :size="15" /> Cancelar
          </button>
          <button
            class="btn"
            :class="variant === 'danger' ? 'btn-danger-solid' : 'btn-primary'"
            type="button"
            :disabled="saving || saveDisabled"
            @click="emit('save')"
          >
            <Save :size="15" />
            {{ saving ? 'Guardando…' : saveLabel }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
