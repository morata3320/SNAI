<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{ items: { l: string; v: number }[] }>()

const hoveredIdx = ref<number | null>(null)
const max = computed(() => Math.max(1, ...props.items.map(d => d.v)))
</script>

<template>
  <div class="card">
    <div class="card-head">
      <div>
        <h3>Expedientes por tipo de medida</h3>
        <div class="sub">Total registrados en el sistema</div>
      </div>
    </div>
    <div class="card-body">
      <div v-if="items.length === 0" style="text-align:center;padding:32px;color:var(--color-text-muted);font-size:14px;">
        Sin expedientes registrados
      </div>
      <div v-else class="bars">
        <div
          v-for="(d, i) in items"
          :key="i"
          class="bar-col"
          style="cursor:default;"
          @mouseenter="hoveredIdx = i"
          @mouseleave="hoveredIdx = null"
        >
          <span
            class="bar-val"
            :style="hoveredIdx === i ? 'font-weight:800;color:var(--color-text-primary)' : ''"
          >{{ d.v }}</span>
          <div
            :class="['bar', i % 2 ? 'alt' : '']"
            :style="{
              height: `${Math.max(6, (d.v / max) * 100)}%`,
              opacity: hoveredIdx !== null && hoveredIdx !== i ? 0.4 : 1,
              transition: 'opacity .15s, height .35s ease',
            }"
          />
          <span class="bar-lbl">{{ d.l }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
