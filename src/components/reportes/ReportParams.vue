<script setup lang="ts">
export interface ReportParamsData {
  tipo: string
  uzdi: string
  fechaInicio: string
  fechaFin: string
  formato: 'tabla' | 'grafico'
}

const props = defineProps<{
  modelValue: ReportParamsData
  generating: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: ReportParamsData]
  generate: []
}>()

const tipoOptions = ['Adolescentes registrados', 'Expedientes abiertos', 'Medidas vigentes', 'Consolidado nacional', 'Alertas pendientes']
const uzdiOptions = ['Todas las UZDI', 'UZDI Quito Norte', 'UZDI Quito Sur', 'UZDI Guayaquil', 'UZDI Cuenca', 'UZDI Ambato']

function update(field: keyof ReportParamsData, value: string) {
  emit('update:modelValue', { ...props.modelValue, [field]: value })
}
</script>

<template>
  <div class="params-card">
    <div class="params-head">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
      </svg>
      <span class="params-title">Parámetros del reporte</span>
    </div>

    <div class="params-grid">
      <div class="field">
        <label class="label">Tipo de reporte <span class="req">*</span></label>
        <select
          :value="modelValue.tipo"
          class="input"
          @change="update('tipo', ($event.target as HTMLSelectElement).value)"
        >
          <option value="">Seleccionar…</option>
          <option v-for="o in tipoOptions" :key="o">{{ o }}</option>
        </select>
      </div>
      <div class="field">
        <label class="label">UZDI</label>
        <select
          :value="modelValue.uzdi"
          class="input"
          @change="update('uzdi', ($event.target as HTMLSelectElement).value)"
        >
          <option v-for="o in uzdiOptions" :key="o">{{ o }}</option>
        </select>
      </div>
      <div class="field">
        <label class="label">Fecha inicio</label>
        <input
          :value="modelValue.fechaInicio"
          class="input"
          type="date"
          @input="update('fechaInicio', ($event.target as HTMLInputElement).value)"
        />
      </div>
      <div class="field">
        <label class="label">Fecha fin</label>
        <input
          :value="modelValue.fechaFin"
          class="input"
          type="date"
          @input="update('fechaFin', ($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>

    <div class="params-footer">
      <div class="format-group">
        <span class="label">Formato:</span>
        <label class="radio-opt">
          <input
            type="radio"
            :checked="modelValue.formato === 'tabla'"
            value="tabla"
            @change="update('formato', 'tabla')"
          />
          <span>Tabla</span>
        </label>
        <label class="radio-opt">
          <input
            type="radio"
            :checked="modelValue.formato === 'grafico'"
            value="grafico"
            @change="update('formato', 'grafico')"
          />
          <span>Gráfico</span>
        </label>
      </div>
      <button
        class="btn-primary"
        :disabled="!modelValue.tipo || generating"
        @click="$emit('generate')"
      >
        <svg v-if="generating" class="spinner" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <path d="M12 2a10 10 0 0 1 10 10"/>
        </svg>
        <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        {{ generating ? 'Generando…' : 'Generar reporte' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.params-card { background: #fff; border-radius: 12px; border: 1px solid var(--color-border); padding: 20px; }

.params-head { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
.params-title { font-size: .9rem; font-weight: 700; color: var(--color-text-primary); }

.params-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }

.params-footer {
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--color-surface-mute); flex-wrap: wrap;
}

.format-group { display: flex; align-items: center; gap: 14px; }

.field { display: flex; flex-direction: column; gap: 5px; }
.label { font-size: .78rem; font-weight: 600; color: var(--color-text-secondary); }
.label .req { color: var(--color-error); margin-left: 2px; }

.input {
  height: 38px; padding: 0 10px;
  border: 1.5px solid var(--color-border); border-radius: 8px;
  font-size: .875rem; color: var(--color-text-primary);
  outline: none; background: #fff;
  transition: border-color .15s;
}
.input:focus { border-color: var(--color-brand-blue); box-shadow: 0 0 0 3px rgba(37,99,235,.15); }

.radio-opt { display: flex; align-items: center; gap: 5px; font-size: .8125rem; color: var(--color-text-secondary); cursor: pointer; }
.radio-opt input { accent-color: var(--color-brand-blue); cursor: pointer; }

.btn-primary {
  display: flex; align-items: center; gap: 6px;
  padding: 9px 18px; background: var(--color-brand-blue); color: #fff;
  border: none; border-radius: 8px;
  font-size: .875rem; font-weight: 600; cursor: pointer;
  transition: background .15s;
}
.btn-primary:hover { background: var(--color-brand-dark); }
.btn-primary:disabled { opacity: .55; cursor: not-allowed; }

.spinner { animation: spin .75s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 900px) { .params-grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 640px) { .params-grid { grid-template-columns: 1fr; } }
</style>
