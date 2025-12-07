

<template>
  <div style="height: 100%; display: flex; flex-direction: column; gap: 16px;">
    
    <XiangQingKaPian :id="id" />

    <PeiFangKaPian v-if="id" :itemId="id" />

  </div>
</template>

<script setup>
// 引入两个子组件
import XiangQingKaPian from './xiang_qing_ka_pian.vue';
import PeiFangKaPian from './pei_fang_ka_pian.vue';

// 接收 App.vue 传来的当前选择 ID
defineProps({
  id: { type: String, default: null }
});
</script>