<script setup lang="ts" generic="T">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight, SearchX } from '@lucide/vue'

export interface DataTableColumn {
  key: string
  label: string
  align?: 'left' | 'center' | 'right'
  width?: string
}

const props = withDefaults(defineProps<{
  columns: DataTableColumn[]
  rows: T[]
  total: number
  page: number
  pageSize: number
  cargando?: boolean
  error?: string | null
  emptyTitle?: string
  emptyMessage?: string
}>(), {
  cargando: false,
  error: null,
  emptyTitle: 'Sin resultados',
  emptyMessage: 'No se encontraron registros con los filtros aplicados.',
})

const emit = defineEmits<{
  'update:page': [page: number]
  retry: []
}>()

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))
const desde = computed(() => (props.total === 0 ? 0 : (props.page - 1) * props.pageSize + 1))
const hasta = computed(() => Math.min(props.page * props.pageSize, props.total))

function irA(pagina: number): void {
  if (pagina < 1 || pagina > totalPages.value || pagina === props.page) return
  emit('update:page', pagina)
}
</script>

<template>
  <div class="tbl-card">
    <div v-if="error" class="errstate" role="alert">
      <p>{{ error }}</p>
      <button class="btn btn-ghost btn-sm" type="button" @click="emit('retry')">Reintentar</button>
    </div>

    <table v-else class="tbl">
      <thead>
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            :style="{ textAlign: col.align ?? 'left', width: col.width }"
            scope="col"
          >{{ col.label }}</th>
        </tr>
      </thead>
      <tbody>
        <template v-if="cargando">
          <tr v-for="n in 5" :key="`sk-${n}`" aria-hidden="true">
            <td v-for="col in columns" :key="col.key">
              <span class="sk" style="display:block;height:14px;width:100%;" />
            </td>
          </tr>
        </template>
        <template v-else-if="rows.length">
          <tr v-for="(row, index) in rows" :key="(row as { id?: number }).id ?? index">
            <slot name="row" :row="row" :index="index" />
          </tr>
        </template>
        <tr v-else>
          <td :colspan="columns.length">
            <div class="tbl-empty">
              <SearchX :size="26" aria-hidden="true" />
              <b>{{ emptyTitle }}</b>
              <span>{{ emptyMessage }}</span>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="!error" class="pag">
      <div class="pag-info">
        Mostrando <b>{{ desde }}–{{ hasta }}</b> de <b>{{ total }}</b> registros
      </div>
      <div class="pag-ctrl">
        <button
          class="pag-btn"
          :class="{ 'is-disabled': page <= 1 }"
          :disabled="page <= 1"
          type="button"
          aria-label="Página anterior"
          @click="irA(page - 1)"
        >
          <ChevronLeft :size="15" />
        </button>
        <button
          v-for="p in totalPages"
          :key="p"
          class="pag-btn"
          :class="{ 'is-active': p === page }"
          type="button"
          :aria-current="p === page ? 'page' : undefined"
          @click="irA(p)"
        >{{ p }}</button>
        <button
          class="pag-btn"
          :class="{ 'is-disabled': page >= totalPages }"
          :disabled="page >= totalPages"
          type="button"
          aria-label="Página siguiente"
          @click="irA(page + 1)"
        >
          <ChevronRight :size="15" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tbl-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 34px 16px;
  color: var(--color-text-muted);
}
.tbl-empty b { color: var(--color-text-secondary); font-size: 14px; }
.tbl-empty span { font-size: 13px; }
.errstate { padding: 34px 20px; }
</style>
