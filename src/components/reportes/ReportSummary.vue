<script setup lang="ts">
export interface ReportTotals {
  adolescentes: number
  expedientes: number
  medidas: number
  alertas: number
}

defineProps<{
  totals: ReportTotals
}>()
</script>

<template>
  <div class="summary-row">
    <div class="chip chip-blue">
      <span class="val">{{ totals.adolescentes.toLocaleString() }}</span>
      <span class="lbl">Adolescentes</span>
    </div>
    <div class="chip chip-green">
      <span class="val">{{ totals.expedientes }}</span>
      <span class="lbl">Expedientes</span>
    </div>
    <div class="chip chip-yellow">
      <span class="val">{{ totals.medidas }}</span>
      <span class="lbl">Medidas</span>
    </div>
    <div class="chip chip-red">
      <span class="val">{{ totals.alertas }}</span>
      <span class="lbl">Alertas</span>
    </div>
  </div>
</template>

<style scoped>
.summary-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }

.chip {
  background: #fff; border-radius: 10px; border: 1px solid var(--color-border);
  padding: 14px 18px; display: flex; flex-direction: column; gap: 2px;
}

.val { font-size: 1.375rem; font-weight: 700; letter-spacing: -.03em; }
.lbl { font-size: .75rem; color: var(--color-text-muted); }

.chip-blue   .val { color: var(--color-brand-blue); }
.chip-green  .val { color: var(--color-success); }
.chip-yellow .val { color: var(--color-warning); }
.chip-red    .val { color: var(--color-error); }

@media (max-width: 640px) { .summary-row { grid-template-columns: 1fr 1fr; } }
</style>
