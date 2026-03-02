<template>
  <div style="display: flex; flex-direction: column; gap: 16px; height: 100%;">
    
    <n-card size="small" title="🌐 跨星系云端节点" style="border-radius: 8px; flex-shrink: 0;">
      <yun_duan_qu_kuai />
    </n-card>

    <n-card size="small" title="🗄️ 本地存储池与配额" style="flex: 1; border-radius: 8px; overflow-y: auto;">
      
      <div v-if="!计算机._当前机箱.装备的主板 || 计算机._当前机箱.装备的硬盘.length === 0" style="padding: 40px 0;">
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
  </div>
</template>

<script setup>
import { use计算机系统 } from '@/stores/ji_suan_ji_xi_tong.js';
import pei_e_qu_kuai from './pei_e_qu_kuai.vue';
import yun_duan_qu_kuai from './yun_duan_qu_kuai.vue'; 
import { useThemeVars } from 'naive-ui'; 

const themeVars = useThemeVars(); 
const 计算机 = use计算机系统();
</script>

<style scoped>
:deep(.n-collapse-item__header) {
  font-weight: bold;
  font-size: 14px;
  background-color: v-bind('themeVars.tableColor'); 
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