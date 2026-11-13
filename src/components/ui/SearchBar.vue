<script setup lang="ts">
defineProps<{
  modelValue: string
  placeholder?: string
  count?: number
  countLabel?: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <div class="search-toolbar">
    <div class="search-wrap">
      <svg class="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input
        :value="modelValue"
        class="search-input"
        :placeholder="placeholder ?? 'Buscar…'"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
    </div>
    <span v-if="count !== undefined" class="record-count">
      {{ count }} {{ countLabel ?? 'resultado' }}{{ count !== 1 ? 's' : '' }}
    </span>
  </div>
</template>

<style scoped>
.search-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.search-wrap {
  position: relative;
  flex: 1;
  max-width: 380px;
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-placeholder);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 8px 12px 8px 32px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: .875rem;
  color: var(--color-text-primary);
  outline: none;
  background: var(--color-surface-soft);
  transition: border-color .15s, box-shadow .15s;
}

.search-input:focus {
  border-color: var(--color-brand-blue);
  box-shadow: 0 0 0 3px rgba(37,56,155,.1);
  background: #fff;
}

.record-count {
  font-size: .8rem;
  color: var(--color-text-placeholder);
  white-space: nowrap;
}
</style>
