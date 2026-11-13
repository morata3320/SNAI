<script setup lang="ts">
import { ref, computed } from 'vue'

interface DonutSlice { l: string; v: number; c: string }
const props = defineProps<{ items: DonutSlice[] }>()

const selectedIdx = ref<number | null>(null)
const total = computed(() => props.items.reduce((a, b) => a + b.v, 0))

const R = 60
const C = 2 * Math.PI * R

const slices = computed(() => {
  let accumulated = 0
  return props.items.map((d, i) => {
    const frac = total.value > 0 ? d.v / total.value : 0
    const len  = frac * C
    const offset = accumulated
    accumulated += len
    const isSelected = selectedIdx.value === i
    const isDimmed   = selectedIdx.value !== null && !isSelected
    return { ...d, len, offset, isSelected, isDimmed }
  })
})

function toggleSlice(i: number) {
  selectedIdx.value = selectedIdx.value === i ? null : i
}

const activeSlice = computed(() =>
  selectedIdx.value !== null ? props.items[selectedIdx.value] : null
)
</script>

<template>
  <div class="card">
    <div class="card-head">
      <h3>Estado de expedientes</h3>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10Z"/>
      </svg>
    </div>
    <div class="card-body" style="display:grid;place-items:center;">
      <div v-if="total === 0" style="text-align:center;padding:32px;color:var(--color-text-muted);font-size:14px;">
        Sin expedientes registrados
      </div>
      <div v-else class="donut-wrap">
        <div class="donut">
          <svg width="150" height="150" viewBox="0 0 150 150">
            <circle cx="75" cy="75" :r="R" fill="none" stroke="#f1f5f9" stroke-width="20" />
            <circle
              v-for="(s, i) in slices"
              :key="i"
              cx="75" cy="75" :r="R"
              fill="none"
              :stroke="s.c"
              stroke-width="20"
              :stroke-dasharray="`${s.len} ${C - s.len}`"
              :stroke-dashoffset="`${-s.offset}`"
              transform="rotate(-90 75 75)"
              stroke-linecap="butt"
              :style="{
                opacity: s.isDimmed ? 0.25 : 1,
                transition: 'opacity .2s',
                cursor: 'pointer',
              }"
              @click="toggleSlice(i)"
            />
          </svg>
          <div class="donut-center" style="cursor:default;">
            <template v-if="activeSlice">
              <b :style="{ color: items[selectedIdx!].c }">{{ activeSlice.v }}</b>
              <span style="font-size:11px;text-align:center;line-height:1.2;">{{ activeSlice.l }}</span>
            </template>
            <template v-else>
              <b>{{ total }}</b>
              <span>expedientes</span>
            </template>
          </div>
        </div>
        <div class="legend">
          <div
            v-for="(s, i) in slices"
            :key="s.l"
            class="legend-item"
            style="cursor:pointer;transition:opacity .2s;"
            :style="{ opacity: s.isDimmed ? 0.4 : 1 }"
            @click="toggleSlice(i)"
          >
            <span
              class="sw"
              :style="{
                background: s.c,
                outline: s.isSelected ? `2px solid ${s.c}` : 'none',
                outlineOffset: '2px',
              }"
            />
            {{ s.l }}
            <b>{{ s.v }}</b>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
