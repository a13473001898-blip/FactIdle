<template>
  <n-flex justify="space-between" align="center" style="width: 100%;">
    
    <n-flex align="center" gap="16px">
      <n-button 
        :type="游戏控制.暂停 ? 'warning' : 'primary'" 
        strong 
        secondary 
        @click="游戏控制.切换暂停状态()"
      >
        {{ 游戏控制.暂停 ? '▶ 恢复运行' : '⏸ 暂停游戏' }}
      </n-button>
      
      <n-button-group>
        <n-button secondary :type="算力警告 ? 'error' : 'default'" @click="游戏控制.打开计算面板()">
          <span>内存: {{ 格式化字节(计算机.已用内存容量) }}/{{ 格式化字节(计算机.总内存容量) }}</span>
        </n-button>
        <n-button secondary :type="硬盘警告 ? 'error' : 'default'" @click="游戏控制.打开计算面板()">
          <span>硬盘: {{ 格式化字节(计算机.已用硬盘容量) }}/{{ 格式化字节(计算机.总硬盘容量) }}</span>
        </n-button>
      </n-button-group>
    </n-flex>

    <n-flex gap="24px" align="center">
      
      <div style="width: 200px;">
        <n-text depth="3" v-if="!科技系统.当前研发.科技ID">当前未进行研究</n-text>
        <div v-else>
          <n-flex justify="space-between" align="center" style="margin-bottom: 2px;">
            <n-text style="font-size: 13px; font-weight: bold;">
              {{ 获取科技数据(科技系统.当前研发.科技ID)?.名称 }}
            </n-text>
            <n-text style="font-size: 12px;" depth="3">
              {{ Math.floor((科技系统.当前研发.已完成比例 || 0) * 100) }}%
            </n-text>
          </n-flex>
          <n-progress type="line" :percentage="(科技系统.当前研发.已完成比例 || 0) * 100" :show-indicator="false" status="info" processing />
        </div>
      </div>

      <n-flex gap="16px">
        <div v-for="type in ['热能', '蒸汽', '电力']" :key="type" style="width: 120px;">
          <n-flex justify="space-between" align="center" style="margin-bottom: 2px;">
            <n-text style="font-size: 12px;" depth="2">{{ type }}负载</n-text>
            <n-text style="font-size: 12px; font-family: monospace;" depth="3">
              {{ 格式化数字(能源模块.数据[type]?.需求 || 0) }} / {{ 格式化数字(能源模块.数据[type]?.供应 || 0) }} 
            </n-text>
          </n-flex>
          <n-progress type="line" :percentage="能源模块.获取能源负载百分比(type)" :show-indicator="false"
            :status="能源模块.获取能源状态颜色(type)" />
        </div>
      </n-flex>

    </n-flex>
  </n-flex>
</template>

<script setup>
import { computed } from 'vue';
import { 获取科技数据 } from '@/pei_zhi_shu_ju';
import { use科技系统 } from '@/stores/ke_ji_xi_tong';
import { use能源模块 } from '@/stores/neng_yuan_xi_tong.js';
import { use游戏控制 } from '@/stores/you_xi_kong_zhi.js';
import { 格式化数字, 格式化字节 } from '@/gong_ju'

// 引入计算机系统和配方分配（用来算已用内存容量）
import { use计算机系统 } from '@/stores/ji_suan_ji_xi_tong.js';
import { use配方分配 } from '@/stores/pei_fang_fen_pei.js';
import { 获取建筑数据 } from '@/pei_zhi_shu_ju';

const 能源模块 = use能源模块();
const 科技系统 = use科技系统();
const 游戏控制 = use游戏控制();
const 计算机 = use计算机系统();

// 计算所有分类的总物理容量

// 警告逻辑
const 算力警告 = computed(() => 计算机.已用内存容量 >= 计算机.总内存容量);
const 硬盘警告 = computed(() => {
    if (计算机.总硬盘容量.value === 0) return true;
    return (计算机.已用硬盘容量 / 计算机.总硬盘容量) > 0.95;
});
</script>