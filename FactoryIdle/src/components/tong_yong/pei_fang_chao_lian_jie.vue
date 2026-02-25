<template>
  <n-popover 
    trigger="hover" 
    placement="right" 
    :keep-alive-on-hover="true"
    style="padding: 0; background: transparent; box-shadow: none;"
  >
    <template #trigger>
      <n-tag 
        size="small" 
        :bordered="false" 
        type="success" 
        style="cursor: help; transition: all 0.2s;"
      >
        {{ 配方名称 }}
      </n-tag>
    </template>

    <div style="width: 280px; padding: 16px; background: white; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); border: 1px solid #eef0f5;">
      
      <n-flex justify="space-between" align="center" style="margin-bottom: 12px;">
        <n-text strong style="font-size: 13px; color: #666;">{{ 配方名称 }}</n-text>
        <n-tag size="small" type="warning" :bordered="false" style="font-weight: bold;">
          ⏳ {{ recipe?.时间 }}s
        </n-tag>
      </n-flex>

      <div style="display: flex; align-items: center; gap: 12px; min-height: 40px;">
        <div style="flex: 1; display: flex; flex-wrap: wrap; gap: 6px;">
          <n-text v-if="!recipe?.输入 || recipe.输入.length === 0" depth="3" style="font-size: 12px;">无消耗</n-text>
          <n-tag v-else v-for="item in recipe.输入" :key="item.id" size="small" type="info" bordered style="font-size: 12px;">
            <wu_pin_chao_lian_jie :id="item.id" /> ×{{ item.数量 }}
          </n-tag>
        </div>

        <div style="flex-shrink: 0; color: #18a058; font-size: 16px; font-weight: bold;">➔</div>

        <div style="flex-shrink: 0; display: flex; flex-direction: column; gap: 6px;">
          <n-tag v-for="item in recipe?.输出" :key="item.id" size="small" type="success" style="font-size: 12px; font-weight: bold;">
            <Wu_pin_chao_lian_jie :id="item.id" style="color: #18a058; border-color: transparent;" /> ×{{ item.数量 }}
          </n-tag>
        </div>
      </div>

    </div>
  </n-popover>
</template>

<script setup>
import { computed } from 'vue';
import { 获取配方数据, 获取物品数据 } from '@/pei_zhi_shu_ju.js';
import Wu_pin_chao_lian_jie from './wu_pin_chao_lian_jie.vue';


const props = defineProps({
  id: { type: String, required: true }
});

const recipe = computed(() => 获取配方数据(props.id));

// 如果配方没有名字，就用它的第一个产出物的名字兜底
const 配方名称 = computed(() => {
  return recipe.value?.名称 || 获取物品数据(recipe.value?.输出?.[0]?.id)?.名称 || props.id;
});
</script>