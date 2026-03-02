<template>
  <div class="ji-suan-ji-container">
    <div class="system-monitor-header">
      
      <n-flex justify="space-between" align="center" class="header-top-row">
        <n-flex align="center">
          <n-tag type="success" size="small" :bordered="false" round>核心平台</n-tag>
          <n-text strong class="platform-text">{{ 计算机.当前平台() || '未检测到主板' }}</n-text>
        </n-flex>
        <n-text depth="3" class="system-status-text">SYSTEM STATUS: NOMINAL</n-text>
      </n-flex>

      <n-flex justify="space-around" align="center" :wrap="false">
        
        <zhuang_tai_yi_biao 
          label="内存"
          :percentage="内存百分比"
          :value-text="格式化字节(计算机.已用内存容量())"
          :status="内存仪表状态"
        />

        <zhuang_tai_yi_biao 
          label="物体"
          :percentage="计算百分比('物体')"
          :value-text="格式化字节(计算机.分类总容量().物体)"
          :status="获取存储状态('物体')"
        />

        <zhuang_tai_yi_biao 
          label="流体"
          :percentage="计算百分比('流体')"
          :value-text="格式化字节(计算机.分类总容量().流体)"
          :status="获取存储状态('流体')"
        />

        <zhuang_tai_yi_biao 
          label="能源"
          :percentage="计算百分比('能源')"
          :value-text="格式化字节(计算机.分类总容量().能源)"
          :status="获取存储状态('能源')"
        />

      </n-flex>
    </div>

    <n-grid :cols="2" x-gap="20" style="flex: 1; min-height: 0;">
      <n-grid-item class="column-layout">
        <ying_jian_guan_li />
      </n-grid-item>
      <n-grid-item class="column-layout">
        <cun_chu_guan_li />
      </n-grid-item>
    </n-grid>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { use计算机系统 } from '@/stores/ji_suan_ji_xi_tong.js';
import { 格式化字节 } from '@/gong_ju';
import ying_jian_guan_li from './ying_jian_guan_li.vue';
import cun_chu_guan_li from './cun_chu_guan_li.vue';
import zhuang_tai_yi_biao from './zhuang_tai_yi_biao.vue';
import { use游戏设置 } from '@/stores/she_zhi.js';
import { useThemeVars } from 'naive-ui';

const themeVars = useThemeVars();
const 游戏设置 = use游戏设置();
const 计算机 = use计算机系统();

const 内存百分比 = computed(() => {
  const total = 计算机.总内存容量();
  if (total <= 0) return 0;
  return Math.min((计算机.已用内存容量() / total) * 100, 100);
});

const 内存仪表状态 = computed(() => {
  const p = 内存百分比.value / 100; 
  if (p >= 游戏设置.阈值配置['内存红色报警']) return 'error';
  if (p >= 游戏设置.阈值配置['内存黄色预警']) return 'warning';
  return 'info';
});

const 获取存储状态 = (category) => {
  const p = 计算百分比(category) / 100;
  if (p >= 游戏设置.阈值配置['硬盘红色报警']) return 'error';
  if (p >= 游戏设置.阈值配置['硬盘黄色预警']) return 'warning';
  return 'success';
};

const 计算百分比 = (category) => {
  const total = 计算机.分类总容量()[category] || 0;
  if (total <= 0) return 0;
  const used = total - 计算机.公共池状态()[category].剩余;
  return Math.min((used / total) * 100, 100);
};
</script>

<style scoped>
.ji-suan-ji-container { height: 100%; display: flex; flex-direction: column; gap: 16px; }
.system-monitor-header { background: v-bind('themeVars.modalColor'); padding: 24px 16px; border-radius: 12px; border: 1px solid v-bind('themeVars.borderColor'); }
.header-top-row { margin-bottom: 24px; padding: 0 12px; }
.platform-text { font-size: 16px; color: #18a058; }
.system-status-text { font-size: 12px; font-family: monospace; letter-spacing: 1px; }
.column-layout { display: flex; flex-direction: column; }
</style>