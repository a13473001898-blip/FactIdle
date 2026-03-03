<template>
  <n-flex vertical align="center" style="width: 25%;">
    <n-progress 
      type="circle" 
      :percentage="percentage" 
      :status="status" 
      :stroke-width="8"
    >
      <div style="text-align: center;">
        <div style="font-size: 11px; opacity: 0.5; font-weight: bold;">{{ label }}</div>
        <div style="font-size: 16px; font-weight: 800; font-family: tabular-nums;">
          {{ Math.floor(percentage) }}%
        </div>
      </div>
    </n-progress>
    
    <n-text depth="3" style="font-size: 11px; margin-top: 12px; font-family: monospace; white-space: nowrap;">
      {{ valueText }}
    </n-text>
  </n-flex>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  percentage: { type: Number, default: 0 },
  valueText: { type: String, default: '' },
  status: { type: String, default: 'info' }
});
</script>

<style scoped>
/* 确保数字跳动不影响布局 */
:deep(.n-progress-content) {
  font-variant-numeric: tabular-nums;
}
</style>