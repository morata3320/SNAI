<script setup lang="ts">
import { ref } from 'vue'
import ModulePanel from '../components/crud/ModulePanel.vue'
import { REPRESENTANTE, VINCULO } from '../entities/registry'

const pestana = ref<'representantes' | 'vinculos'>('representantes')
</script>

<template>
  <div class="hero">
    <p class="hero-eyebrow">Gestión</p>
    <div class="hero-row">
      <div>
        <h1>Representantes y familiares</h1>
        <p>Datos de contacto y vínculos con los adolescentes. Un representante puede tener varios vínculos.</p>
      </div>
    </div>
  </div>

  <div class="tabs" role="tablist" aria-label="Secciones de representantes">
    <button
      class="tab"
      :class="{ 'is-active': pestana === 'representantes' }"
      type="button"
      role="tab"
      :aria-selected="pestana === 'representantes'"
      @click="pestana = 'representantes'"
    >Representantes</button>
    <button
      class="tab"
      :class="{ 'is-active': pestana === 'vinculos' }"
      type="button"
      role="tab"
      :aria-selected="pestana === 'vinculos'"
      @click="pestana = 'vinculos'"
    >Vínculos</button>
  </div>

  <ModulePanel v-if="pestana === 'representantes'" :def="REPRESENTANTE" />
  <ModulePanel v-else :def="VINCULO" />
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
</style>
