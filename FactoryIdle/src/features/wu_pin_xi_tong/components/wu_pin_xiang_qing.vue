<template>
  <div style="height: 100%; display: flex; flex-direction: column; gap: 16px;">
    
    <n-empty v-if="!id" description="请选择一个物品" style="margin-top: 100px;" />
    
    <div v-else style="overflow-y: auto; padding-right: 8px;">
      <n-collapse :default-expanded-names="['基础信息', '自动化']">

        <n-collapse-item title="基础信息" name="基础信息">
          <xiang_qing_ka_pian :id="id" />
        </n-collapse-item>
      
        <n-collapse-item title="自动化" name="自动化" style="margin-top: 16px;">
          <pei_fang_ka_pian v-if="id" :itemId="id" :lineId="lineId" />
          <n-divider/>
        </n-collapse-item>

      </n-collapse>
    </div>

  </div>
</template>

<script setup>
import xiang_qing_ka_pian from './xiang_qing_ka_pian.vue';
import pei_fang_ka_pian from './pei_fang_ka_pian.vue';
import { useThemeVars } from 'naive-ui';
const themeVars = useThemeVars();

defineProps({
  id: { type: String, default: null },
  lineId: { type: String, default: 'default' } // 🌟 接收外部传入的线ID
});
</script>

<style scoped>
:deep(.n-collapse-item__header) {
  font-size: 15px; font-weight: bold; padding-bottom: 4px;
}
:deep(.n-collapse-item__content-inner) { padding: 0 !important; }
:deep(.n-card) { border: none !important; }
:deep(.n-tabs-nav) { background-color: transparent !important; }
</style>