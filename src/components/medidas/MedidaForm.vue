<script setup lang="ts">
export interface MedidaFormData {
  adolescente: string
  tipo: string
  fechaInicio: string
  fechaFin: string
  estado: 'Vigente' | 'Cumplida' | 'Incumplida' | 'Por vencer'
  uzdi: string
  observaciones: string
}

export interface MedidaFormErrors {
  adolescente: string
  tipo: string
  fechaInicio: string
  fechaFin: string
  uzdi: string
}

const props = defineProps<{
  modelValue: MedidaFormData
  errors: MedidaFormErrors
  saving: boolean
  isEdit: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: MedidaFormData]
  submit: []
  cancel: []
}>()

const tipoOptions = ['Libertad asistida', 'Servicio comunitario', 'Internamiento', 'Orientación familiar', 'Amonestación', 'Prestación de servicios']
const uzdiOptions = ['UZDI Quito Norte', 'UZDI Quito Sur', 'UZDI Guayaquil', 'UZDI Cuenca', 'UZDI Ambato']

function update(field: keyof MedidaFormData, value: string) {
  emit('update:modelValue', { ...props.modelValue, [field]: value })
}
</script>

<template>
  <form class="form-body" @submit.prevent="$emit('submit')">
    <div class="field">
      <label class="label">Adolescente <span class="req">*</span></label>
      <input
        :value="modelValue.adolescente"
        class="input"
        :class="{ 'is-error': errors.adolescente }"
        type="text"
        placeholder="Nombre completo"
        @input="update('adolescente', ($event.target as HTMLInputElement).value)"
      />
      <span v-if="errors.adolescente" class="err-msg">{{ errors.adolescente }}</span>
    </div>

    <div class="field">
      <label class="label">Tipo de medida <span class="req">*</span></label>
      <select
        :value="modelValue.tipo"
        class="input"
        :class="{ 'is-error': errors.tipo }"
        @change="update('tipo', ($event.target as HTMLSelectElement).value)"
      >
        <option value="">Seleccionar…</option>
        <option v-for="o in tipoOptions" :key="o">{{ o }}</option>
      </select>
      <span v-if="errors.tipo" class="err-msg">{{ errors.tipo }}</span>
    </div>

    <div class="field-row">
      <div class="field">
        <label class="label">Fecha inicio <span class="req">*</span></label>
        <input
          :value="modelValue.fechaInicio"
          class="input"
          :class="{ 'is-error': errors.fechaInicio }"
          type="date"
          @input="update('fechaInicio', ($event.target as HTMLInputElement).value)"
        />
        <span v-if="errors.fechaInicio" class="err-msg">{{ errors.fechaInicio }}</span>
      </div>
      <div class="field">
        <label class="label">Fecha fin <span class="req">*</span></label>
        <input
          :value="modelValue.fechaFin"
          class="input"
          :class="{ 'is-error': errors.fechaFin }"
          type="date"
          @input="update('fechaFin', ($event.target as HTMLInputElement).value)"
        />
        <span v-if="errors.fechaFin" class="err-msg">{{ errors.fechaFin }}</span>
      </div>
    </div>

    <div class="field-row">
      <div class="field">
        <label class="label">Estado</label>
        <select
          :value="modelValue.estado"
          class="input"
          @change="update('estado', ($event.target as HTMLSelectElement).value)"
        >
          <option>Vigente</option>
          <option>Por vencer</option>
          <option>Cumplida</option>
          <option>Incumplida</option>
        </select>
      </div>
      <div class="field">
        <label class="label">UZDI <span class="req">*</span></label>
        <select
          :value="modelValue.uzdi"
          class="input"
          :class="{ 'is-error': errors.uzdi }"
          @change="update('uzdi', ($event.target as HTMLSelectElement).value)"
        >
          <option value="">Seleccionar…</option>
          <option v-for="o in uzdiOptions" :key="o">{{ o }}</option>
        </select>
        <span v-if="errors.uzdi" class="err-msg">{{ errors.uzdi }}</span>
      </div>
    </div>

    <div class="field">
      <label class="label">Observaciones</label>
      <textarea
        :value="modelValue.observaciones"
        class="input textarea"
        placeholder="Notas de seguimiento…"
        rows="3"
        @input="update('observaciones', ($event.target as HTMLTextAreaElement).value)"
      />
    </div>

    <div class="actions">
      <button type="button" class="btn-ghost" @click="$emit('cancel')">Cancelar</button>
      <button type="submit" class="btn-primary" :disabled="saving">
        <svg v-if="saving" class="spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <path d="M12 2a10 10 0 0 1 10 10"/>
        </svg>
        {{ saving ? 'Guardando…' : (isEdit ? 'Guardar cambios' : 'Registrar medida') }}
      </button>
    </div>
  </form>
</template>

<style scoped>
.form-body { display: flex; flex-direction: column; gap: 16px; }
.field      { display: flex; flex-direction: column; gap: 5px; }
.field-row  { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.label { font-size: .8rem; font-weight: 600; color: var(--color-text-secondary); }
.label .req { color: var(--color-error); margin-left: 2px; }

.input {
  height: 40px; padding: 0 12px;
  border: 1.5px solid var(--color-border); border-radius: 8px;
  font-size: .875rem; color: var(--color-text-primary);
  outline: none; background: #fff;
  transition: border-color .15s, box-shadow .15s;
}
.input:focus { border-color: var(--color-brand-blue); box-shadow: 0 0 0 3px rgba(37,99,235,.15); }
.input.is-error { border-color: var(--color-error); }
.textarea { height: auto; padding: 10px 12px; resize: vertical; }

.err-msg { font-size: .75rem; color: var(--color-error); font-weight: 500; }

.actions { display: flex; justify-content: flex-end; gap: 10px; padding-top: 8px; }

.btn-primary {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 16px; background: var(--color-brand-blue); color: #fff;
  border: none; border-radius: 8px;
  font-size: .8125rem; font-weight: 600; cursor: pointer;
  transition: background .15s;
}
.btn-primary:hover { background: var(--color-brand-dark); }
.btn-primary:disabled { opacity: .65; cursor: not-allowed; }

.btn-ghost {
  padding: 8px 14px; background: #fff; color: var(--color-text-secondary);
  border: 1px solid var(--color-border); border-radius: 8px;
  font-size: .8125rem; font-weight: 500; cursor: pointer;
}
.btn-ghost:hover { background: var(--color-surface-soft); }

.spinner { animation: spin .75s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
