<template>
  <n-card size="small" title="🗄️ 存储池与保底配额" style="flex: 1; border-radius: 8px; overflow-y: auto;">
    
    <div v-if="!计算机.装备的主板 || 计算机.装备的硬盘.length === 0" style="padding: 40px 0;">
      <n-empty description="尚未挂载任何硬盘，系统缺乏存储介质" />
    </div>
    
    <div v-else>
      <n-collapse :default-expanded-names="['物体']" accordion>
        
        <n-collapse-item title="📦 物体存储区" name="物体">
          <pei_e_qu_kuai category="物体" />
        </n-collapse-item>

        <n-collapse-item title="💧 流体存储区" name="流体">
          <pei_e_qu_kuai category="流体" />
        </n-collapse-item>

        <n-collapse-item title="⚡ 能源存储区" name="能源">
          <pei_e_qu_kuai category="能源" />
        </n-collapse-item>

      </n-collapse>
    </div>

  </n-card>
</template>

<script setup>
import { use计算机系统 } from '@/stores/ji_suan_ji_xi_tong.js';
// 引入刚刚建好的积木组件
import pei_e_qu_kuai from './pei_e_qu_kuai.vue';

const 计算机 = use计算机系统();
</script>

<style scoped>
/* 美化折叠面板样式 */
:deep(.n-collapse-item__header) {
  font-weight: bold;
  font-size: 14px;
  background-color: #f8f8fa;
  padding: 8px 12px !important;
  border-radius: 6px;
  margin-bottom: 4px;
}
:deep(.n-collapse-item__content-inner) {
  padding-top: 12px !important;
  padding-bottom: 16px !important;
  padding-left: 4px !important;
  padding-right: 4px !important;
}
</style>