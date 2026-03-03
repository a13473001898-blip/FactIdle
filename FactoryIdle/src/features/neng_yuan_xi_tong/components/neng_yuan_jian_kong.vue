<template>
  <n-flex gap="16px" :wrap="false">
    <div v-for="type in ['热能', '蒸汽', '电力']" :key="type" class="energy-item">
      <n-flex justify="space-between" align="baseline" style="margin-bottom: 2px;">
        <n-text depth="3" style="font-size: 11px;">{{ type }}</n-text>
        <n-text :class="['energy-value', 能源模块.获取能源状态颜色(type)]">
          {{ 格式化数字(能源模块.查询能源(type)?.需求 || 0) }}/{{ 格式化数字(能源模块.查询能源(type)?.产出 || 0) }}
        </n-text>
      </n-flex>
      <n-progress 
        type="line" 
        :percentage="能源模块.获取能源负载百分比(type)" 
        :show-indicator="false"
        :status="能源模块.获取能源状态颜色(type)" 
        style="height: 6px;" 
      />
    </div>
  </n-flex>
</template>

<script setup>
import { use能源模块 } from '../store.js';
import { 格式化数字 } from '@/shared/gong_ju.js';

const 能源模块 = use能源模块();
</script>

<style scoped>
.energy-item { width: 145px; flex-shrink: 0; }
.energy-value {
  font-size: 11px;
  font-family: 'Fira Code', monospace;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.success { color: #18a058; }
.warning { color: #f0a020; }
.error { color: #d03050; }
:deep(.n-progress-content) { line-height: 1 !important; }
</style>