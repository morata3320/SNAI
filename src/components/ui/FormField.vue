<script setup lang="ts">
import { computed, useId } from 'vue'

const props = withDefaults(defineProps<{
  label: string
  forId?: string
  required?: boolean
  error?: string
  hint?: string
}>(), {
  required: false,
  error: '',
  hint: '',
})

const uid = useId()
const controlId = computed(() => props.forId ?? `campo-${uid}`)
const errorId = computed(() => `${controlId.value}-err`)
const hintId = computed(() => `${controlId.value}-hint`)
const describedBy = computed(() => (props.error ? errorId.value : props.hint ? hintId.value : undefined))
</script>

<template>
  <div class="f">
    <label class="f-label" :for="controlId">
      {{ label }}
      <span v-if="required" class="req" aria-hidden="true">*</span>
    </label>
    <slot :id="controlId" :describedby="describedBy" :invalid="!!error" />
    <p v-if="hint && !error" :id="hintId" class="f-hint">{{ hint }}</p>
    <p v-if="error" :id="errorId" class="f-err" role="alert">{{ error }}</p>
  </div>
</template>
