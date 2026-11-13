<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import ModulePanel from '../components/crud/ModulePanel.vue'
import { MODULES } from '../entities/registry'
import type { ModuleId } from '../router/access'

const route = useRoute()

const def = computed(() => MODULES[route.meta.module as ModuleId])
</script>

<template>
  <div v-if="def">
    <div class="hero">
      <p class="hero-eyebrow">Gestión</p>
      <div class="hero-row">
        <div>
          <h1>{{ def.title }}</h1>
          <p>{{ def.subtitle }}</p>
        </div>
      </div>
    </div>
    <ModulePanel :key="def.path" :def="def" />
  </div>
</template>
