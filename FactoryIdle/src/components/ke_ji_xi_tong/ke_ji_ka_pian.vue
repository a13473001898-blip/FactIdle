<template>
  <n-card hoverable size="small" @click="$emit('click', id)"
    style="cursor: pointer; height: 100%; display: flex; flex-direction: column;" class="ke-ji-card">
    <template #header>
      <span style="font-weight: bold; font-size: 15px;">{{ 科技?.名称 }}</span>
    </template>

    <div style="flex-grow: 1;">
      <n-text depth="3" style="font-size: 12px; margin-bottom: 12px; display: block;">
        ⏳ 耗时: {{ 科技?.耗时 }}s
      </n-text>

      <div style="margin-bottom: 12px; min-height: 48px;">
        <n-text depth="3" style="font-size: 12px; margin-bottom: 6px; display: block;">研究消耗</n-text>
        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
          <n-tag size="small" type="info" bordered v-for="投入 in 科技?.投入" :key="投入.id" style="font-size: 12px;">
            <Wu_pin_chao_lian_jie :id="投入.id" /> ×{{ 投入.数量 }}
          </n-tag>
        </div>
      </div>

      <div v-if="科技?.解锁配方?.length > 0" style="border-top: 1px dashed #eee; padding-top: 8px;">
        <n-text depth="3" style="font-size: 12px; margin-bottom: 6px; display: block;">解锁配方</n-text>
        <div style="display: flex; flex-wrap: wrap; gap: 4px;">
          <Pei_fang_chao_lian_jie v-for="配方id in 科技.解锁配方" :key="配方id" :id="配方id" />
        </div>
      </div>
    </div>
  </n-card>
</template>

<script setup>
import { computed } from 'vue';
import { 获取科技数据, 获取物品数据, 获取配方数据 } from '@/pei_zhi_shu_ju';
import Wu_pin_chao_lian_jie from '../tong_yong/wu_pin_chao_lian_jie.vue';
import Pei_fang_chao_lian_jie from '../tong_yong/pei_fang_chao_lian_jie.vue';

const props = defineProps({
  id: { type: String, required: true }
});

defineEmits(['click']);

const 科技 = computed(() => 获取科技数据(props.id));
</script>

<style scoped>
.ke-ji-card:active {
  transform: scale(0.98);
  transition: transform 0.1s;
}
</style>