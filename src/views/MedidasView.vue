<script setup lang="ts">
import { ref } from 'vue'
import ModulePanel from '../components/crud/ModulePanel.vue'
import { ASIGNACION_MEDIDA, MEDIDA } from '../entities/registry'

const pestana = ref<'catalogo' | 'asignaciones'>('catalogo')
</script>

<template>
  <div class="hero">
    <p class="hero-eyebrow">Gestión</p>
    <div class="hero-row">
      <div>
        <h1>Medidas socioeducativas</h1>
        <p>Catálogo de medidas y asignación por adolescente. La duración del catálogo es referencial.</p>
      </div>
    </div>
  </div>

  <div class="tabs" role="tablist" aria-label="Secciones de medidas">
    <button
      class="tab"
      :class="{ 'is-active': pestana === 'catalogo' }"
      type="button"
      role="tab"
      :aria-selected="pestana === 'catalogo'"
      @click="pestana = 'catalogo'"
    >Catálogo</button>
    <button
      class="tab"
      :class="{ 'is-active': pestana === 'asignaciones' }"
      type="button"
      role="tab"
      :aria-selected="pestana === 'asignaciones'"
      @click="pestana = 'asignaciones'"
    >Asignaciones</button>
  </div>

  <div v-if="pestana === 'asignaciones'" class="nota" role="note">
    La fecha de fin se registra por asignación. Al elegir la medida puede ajustar la fecha estimada.
  </div>

  <ModulePanel v-if="pestana === 'catalogo'" :def="MEDIDA" />
  <ModulePanel v-else :def="ASIGNACION_MEDIDA" />
</template>

<style scoped>
.tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 14px;
  border-bottom: 1px solid var(--color-border);
}
.tab {
  border: 0;
  background: transparent;
  padding: 10px 14px;
  font: inherit;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--color-text-muted);
  border-bottom: 2px solid transparent;
  cursor: pointer;
}
.tab:hover { color: var(--color-text-primary); }
.tab.is-active {
  color: var(--color-brand-blue);
  border-bottom-color: var(--color-brand-blue);
}
.nota {
  margin-bottom: 14px;
  padding: 10px 14px;
  border-left: 4px solid var(--color-info-border);
  border-radius: var(--radius-md);
  background: var(--color-info-bg);
  color: var(--color-text-secondary);
  font-size: 13px;
}
</style>
