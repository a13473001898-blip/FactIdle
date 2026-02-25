<template>
  <div style="width: 300px;">
    <n-text depth="3" v-if="!科技系统.当前研发.科技ID">
      当前未进行研究
    </n-text>
    <div v-else>
      <n-flex justify="space-between" align="center" style="margin-bottom: 2px;">
        <n-text style="font-size: 13px; font-weight: bold;">
          研发中: {{ 获取科技数据(科技系统.当前研发.科技ID)?.名称 }}
        </n-text>
        <n-text style="font-size: 12px;" depth="3">
          {{ Math.floor((科技系统.当前研发.已完成比例 || 0) * 100) }}%
        </n-text>
      </n-flex>
      <n-progress type="line" :percentage="(科技系统.当前研发.已完成比例 || 0) * 100" :show-indicator="false" status="info"
        processing />
    </div>
  </div>

  <n-flex gap="24px">
    <div v-for="type in ['热能', '蒸汽', '电力']" :key="type" style="width: 140px;">
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
</template>

<script setup>
import { 格式化数字 } from '@/gong_ju';
import { 获取科技数据 } from '@/pei_zhi_shu_ju';
import { use科技系统 } from '@/stores/ke_ji_xi_tong';
import { use能源模块 } from '@/stores/neng_yuan_xi_tong.js'

const 能源模块 = use能源模块()
const 科技系统 = use科技系统()


</script>