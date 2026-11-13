<script setup lang="ts">
export interface ReportRow {
  uzdi: string
  adolescentes: number
  expedientes: number
  medidas: number
  alertas: number
  cumplimiento: string
}

export interface ReportTotals {
  adolescentes: number
  expedientes: number
  medidas: number
  alertas: number
}

defineProps<{
  rows: ReportRow[]
  title: string
  totals: ReportTotals
}>()
</script>

<template>
  <div class="card">
    <div class="card-head">
      <h2 class="card-title">{{ title }}</h2>
    </div>
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>UZDI</th>
            <th class="tr">Adolescentes</th>
            <th class="tr">Expedientes</th>
            <th class="tr">Medidas</th>
            <th class="tr">Alertas</th>
            <th class="tr">Cumplimiento</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.uzdi">
            <td class="fw">{{ r.uzdi }}</td>
            <td class="tr">{{ r.adolescentes.toLocaleString() }}</td>
            <td class="tr">{{ r.expedientes }}</td>
            <td class="tr">{{ r.medidas }}</td>
            <td class="tr">
              <span v-if="r.alertas > 0" class="alert-n">{{ r.alertas }}</span>
              <span v-else class="ok-n">{{ r.alertas }}</span>
            </td>
            <td class="tr">
              <span class="pct" :class="parseInt(r.cumplimiento) >= 90 ? 'pct-green' : 'pct-yellow'">{{ r.cumplimiento }}</span>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td class="fw">Total nacional</td>
            <td class="tr fw">{{ totals.adolescentes.toLocaleString() }}</td>
            <td class="tr fw">{{ totals.expedientes }}</td>
            <td class="tr fw">{{ totals.medidas }}</td>
            <td class="tr fw">{{ totals.alertas }}</td>
            <td class="tr">—</td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<style scoped>
.card { background: #fff; border-radius: 12px; border: 1px solid var(--color-border); overflow: hidden; }

.card-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid var(--color-surface-mute); gap: 12px; flex-wrap: wrap;
}

.card-title { font-size: .9375rem; font-weight: 700; color: var(--color-text-primary); }
.head-actions { display: flex; gap: 8px; }

.btn-sm {
  display: flex; align-items: center; gap: 5px;
  padding: 6px 12px; background: #fff; color: var(--color-text-secondary);
  border: 1px solid var(--color-border); border-radius: 7px;
  font-size: .775rem; font-weight: 500; cursor: pointer;
  transition: background .15s;
}
.btn-sm:hover { background: var(--color-surface-soft); }

.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: .8125rem; }
.data-table th {
  text-align: left; font-size: .7rem; font-weight: 600; color: var(--color-text-placeholder);
  text-transform: none; letter-spacing: .06em;
  padding: 10px 16px; border-bottom: 1px solid var(--color-surface-mute);
}
.data-table td { padding: 12px 16px; border-bottom: 1px solid var(--color-surface-soft); color: var(--color-text-secondary); }
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:hover td { background: var(--color-surface-soft); }
.data-table tfoot td { border-top: 2px solid var(--color-border); background: var(--color-surface-soft); font-size: .8125rem; }

.fw { font-weight: 600; color: var(--color-text-primary); }
.tr { text-align: right; }

.alert-n { font-weight: 700; color: var(--color-error); }
.ok-n    { color: var(--color-text-placeholder); }

.pct { font-size: .7rem; font-weight: 700; padding: 2px 8px; border-radius: 999px; }
.pct-green  { background: var(--color-success-bg); color: var(--color-success); }
.pct-yellow { background: var(--color-warning-bg); color: var(--color-warning); }
</style>
