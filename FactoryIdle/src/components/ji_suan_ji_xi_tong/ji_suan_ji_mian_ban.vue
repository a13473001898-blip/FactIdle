<template>
  <div style="height: 100%; display: flex; flex-direction: column; gap: 16px;">
    
    <n-flex justify="space-between" align="center" style="background: #f8f8fa; padding: 16px; border-radius: 8px; border: 1px solid #eef0f5;">
      <div>
        <n-text depth="3" style="font-size: 13px;">当前核心平台架构</n-text>
        <div style="font-size: 18px; font-weight: bold; color: #18a058; margin-top: 4px;">
          {{ 计算机.当前平台 || '未搭载主板' }}
        </div>
      </div>
      <div>
        <n-text depth="3" style="font-size: 13px;">全网总算力限制</n-text>
        <div style="font-size: 18px; font-weight: bold; color: #2080f0; margin-top: 4px; text-align: right;">
          {{ 计算机.总内存容量 }} ⚡
        </div>
      </div>
    </n-flex>

    <n-grid :cols="2" x-gap="20" style="flex: 1; min-height: 0;">
      
      <n-grid-item style="display: flex; flex-direction: column;">
        <ying_jian_guan_li />
      </n-grid-item>

      <n-grid-item style="display: flex; flex-direction: column;">
        <cun_chu_guan_li />
      </n-grid-item>

    </n-grid>
  </div>
</template>

<script setup>
import { use计算机系统 } from '@/stores/ji_suan_ji_xi_tong.js';
import ying_jian_guan_li from './ying_jian_guan_li.vue';
import cun_chu_guan_li from './cun_chu_guan_li.vue';

const 计算机 = use计算机系统();
</script>