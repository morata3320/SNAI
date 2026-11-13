<script setup lang="ts">
import { useRouter } from 'vue-router'

defineProps<{
  items: { adol: string; medida: string; fin: string; estado: string; tono: string }[]
}>()

const router = useRouter()
</script>

<template>
  <div class="card">
    <div class="card-head">
      <div>
        <h3>Próximos vencimientos</h3>
        <div class="sub">Expedientes ordenados por fecha fin de medida</div>
      </div>
      <button
        class="btn btn-ghost"
        type="button"
        style="font-size:12px;padding:6px 12px;height:32px;display:flex;align-items:center;gap:4px;"
        @click="router.push('/app/expedientes')"
      >
        Ver todos
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
      </button>
    </div>
    <div v-if="items.length === 0" style="text-align:center;padding:32px;color:var(--color-text-muted);font-size:14px;">
      No hay expedientes con fecha de vencimiento registrada
    </div>
    <table v-else class="tbl">
      <thead>
        <tr>
          <th>Adolescente</th>
          <th>Medida</th>
          <th>Fecha fin</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="r in items"
          :key="r.adol + r.fin"
          style="cursor:pointer;"
          @click="router.push('/app/expedientes')"
          @mouseenter="($event.currentTarget as HTMLElement).style.background='var(--color-surface-soft)'"
          @mouseleave="($event.currentTarget as HTMLElement).style.background=''"
        >
          <td><div class="td-name"><b>{{ r.adol }}</b></div></td>
          <td>{{ r.medida }}</td>
          <td>{{ r.fin }}</td>
          <td>
            <span :class="['badge', r.tono]">
              <span class="bdot" />{{ r.estado }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
