<script setup lang="ts">
import { computed, ref } from 'vue'
import ModulePanel from '../components/crud/ModulePanel.vue'
import {
  CANTON, ESTADO_CIVIL, ETNIA, NACIONALIDAD, PROVINCIA,
  type ModuloDef,
} from '../entities/registry'

type ClaveCatalogo = 'provincia' | 'canton' | 'nacionalidad' | 'estado-civil' | 'etnia'

const DEFS: Record<ClaveCatalogo, ModuloDef> = {
  provincia: PROVINCIA,
  canton: CANTON,
  nacionalidad: NACIONALIDAD,
  'estado-civil': ESTADO_CIVIL,
  etnia: ETNIA,
}

const PESTANAS: { key: ClaveCatalogo; label: string }[] = [
  { key: 'provincia', label: 'Provincias' },
  { key: 'canton', label: 'Cantones' },
  { key: 'nacionalidad', label: 'Nacionalidades' },
  { key: 'estado-civil', label: 'Estados civiles' },
  { key: 'etnia', label: 'Etnias' },
]

const actual = ref<ClaveCatalogo>('provincia')
const def = computed(() => DEFS[actual.value])
</script>

<template>
  <div class="hero">
    <p class="hero-eyebrow">Configuración</p>
    <div class="hero-row">
      <div>
        <h1>Catálogos de apoyo</h1>
        <p>Valores normalizados de los formularios. Solo los valores activos se ofrecen en nuevos registros.</p>
      </div>
    </div>
  </div>

  <div class="tabs" role="tablist" aria-label="Catálogos">
    <button
      v-for="pestana in PESTANAS"
      :key="pestana.key"
      class="tab"
      :class="{ 'is-active': actual === pestana.key }"
      type="button"
      role="tab"
      :aria-selected="actual === pestana.key"
      @click="actual = pestana.key"
    >{{ pestana.label }}</button>
  </div>

  <ModulePanel :key="actual" :def="def" />
</template>

<style scoped>
.tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 14px;
  border-bottom: 1px solid var(--color-border);
  overflow-x: auto;
}
.tab {
  border: 0;
  background: transparent;
  padding: 10px 12px;
  font: inherit;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--color-text-muted);
  border-bottom: 2px solid transparent;
  cursor: pointer;
  white-space: nowrap;
}
.tab:hover { color: var(--color-text-primary); }
.tab.is-active {
  color: var(--color-brand-blue);
  border-bottom-color: var(--color-brand-blue);
}
</style>
