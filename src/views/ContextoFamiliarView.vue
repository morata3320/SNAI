<script setup lang="ts">
import { ref } from 'vue'
import ModulePanel from '../components/crud/ModulePanel.vue'
import { CONTEXTO_FICHA, CONTEXTO_INTERVENCION } from '../entities/registry'

const pestana = ref<'intervenciones' | 'fichas'>('intervenciones')
</script>

<template>
  <div class="hero">
    <p class="hero-eyebrow">Eje familiar</p>
    <div class="hero-row">
      <div>
        <h1>Contexto familiar</h1>
        <p>Intervenciones y ficha sociofamiliar. Información confidencial del eje familiar.</p>
      </div>
    </div>
  </div>

  <div class="tabs" role="tablist" aria-label="Secciones de contexto familiar">
    <button
      class="tab"
      :class="{ 'is-active': pestana === 'intervenciones' }"
      type="button"
      role="tab"
      :aria-selected="pestana === 'intervenciones'"
      @click="pestana = 'intervenciones'"
    >Intervenciones</button>
    <button
      class="tab"
      :class="{ 'is-active': pestana === 'fichas' }"
      type="button"
      role="tab"
      :aria-selected="pestana === 'fichas'"
      @click="pestana = 'fichas'"
    >Ficha sociofamiliar</button>
  </div>

  <div v-if="pestana === 'fichas'" class="pendiente" role="note">
    Estructura por definir con la Directora de la UZDI. Por ahora se registran representante, fecha,
    motivo y un campo libre de información complementaria.
  </div>

  <ModulePanel v-if="pestana === 'intervenciones'" :def="CONTEXTO_INTERVENCION" />
  <ModulePanel v-else :def="CONTEXTO_FICHA" />
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
.pendiente {
  margin-bottom: 14px;
  padding: 11px 14px;
  border-left: 4px solid var(--color-warning);
  border-radius: var(--radius-md);
  background: var(--color-warning-bg);
  color: var(--color-text-secondary);
  font-size: 13px;
  line-height: 1.5;
}
</style>
