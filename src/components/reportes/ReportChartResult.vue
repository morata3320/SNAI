<script setup lang="ts">
import { computed } from 'vue'
import type { ReportRow } from './ReportTableResult.vue'

const props = defineProps<{
  rows: ReportRow[]
  title: string
}>()

const barMax = computed(() => Math.max(...props.rows.map(r => r.adolescentes)))
</script>

<template>
  <div class="card">
    <div class="card-head">
      <h2 class="card-title">{{ title }} — Distribución por UZDI</h2>
    </div>
    <div class="chart-area">
      <div v-for="r in rows" :key="r.uzdi" class="bar-row">
        <div class="bar-label">{{ r.uzdi.replace('UZDI ', '') }}</div>
        <div class="bar-track">
          <div class="bar-fill" :style="{ width: `${(r.adolescentes / barMax) * 100}%` }">
            <span class="bar-val">{{ r.adolescentes }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card { background: #fff; border-radius: 12px; border: 1px solid var(--color-border); overflow: hidden; }

.card-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid var(--color-surface-mute);
}

.card-title { font-size: .9375rem; font-weight: 700; color: var(--color-text-primary); }

.chart-area { padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }

.bar-row { display: flex; align-items: center; gap: 12px; }

.bar-label { width: 130px; font-size: .8125rem; color: var(--color-text-secondary); font-weight: 500; flex-shrink: 0; text-align: right; }

.bar-track { flex: 1; background: var(--color-surface-mute); border-radius: 999px; height: 28px; overflow: hidden; }

.bar-fill {
  height: 100%;
  background: var(--color-brand-blue);
  border-radius: 999px;
  display: flex; align-items: center; justify-content: flex-end;
  padding-right: 10px; min-width: 40px;
  transition: width .6s cubic-bezier(.22,1,.36,1);
}

.bar-val { font-size: .75rem; font-weight: 700; color: #fff; }
</style>
