<template>
  <div>
    <!-- Hero skeleton -->
    <div class="hero">
      <span class="sk sk-line" style="width:120px;margin-bottom:10px;" />
      <span class="sk sk-line" style="width:260px;height:24px;margin-bottom:8px;" />
      <span class="sk sk-line" style="width:420px;" />
    </div>

    <!-- 4 stat card skeletons -->
    <div class="stat-grid">
      <div v-for="i in 4" :key="i" class="stat">
        <div class="stat-top">
          <span class="sk sk-circle" style="width:40px;height:40px;" />
          <span class="sk sk-line" style="width:42px;height:18px;border-radius:999px;" />
        </div>
        <span class="sk sk-line" style="width:90px;height:28px;margin-bottom:10px;" />
        <span class="sk sk-line" style="width:120px;" />
      </div>
    </div>

    <!-- grid-2: bar chart + donut -->
    <div class="grid-2" style="margin-bottom:16px;">
      <div class="card">
        <div class="card-head"><span class="sk sk-line" style="width:200px;height:14px;" /></div>
        <div class="card-body" style="height:190px;display:flex;align-items:flex-end;gap:18px;">
          <span v-for="(h, i) in [60,80,45,70,35]" :key="i" class="sk" :style="`width:100%;height:${h}%;border-radius:8px;align-self:flex-end;`" />
        </div>
      </div>
      <div class="card">
        <div class="card-head"><span class="sk sk-line" style="width:130px;height:14px;" /></div>
        <div class="card-body" style="display:grid;place-items:center;height:190px;">
          <span class="sk sk-circle" style="width:150px;height:150px;" />
        </div>
      </div>
    </div>

    <!-- revision table skeleton -->
    <div style="margin-top:0;">
      <div class="tbl-card">
        <div class="card-head"><span class="sk sk-line" style="width:240px;height:14px;" /></div>
        <div v-for="i in 4" :key="i" class="sk-row">
          <span class="sk sk-line" style="flex:2;" />
          <span class="sk sk-line" style="flex:1;" />
          <span class="sk sk-line" style="flex:1;" />
          <span class="sk sk-line" style="width:60px;border-radius:999px;" />
        </div>
      </div>
    </div>
  </div>
</template>
