<template>
  <n-popover 
    trigger="hover" 
    placement="right" 
    :keep-alive-on-hover="true"
    style="padding: 0; background: transparent; box-shadow: none;"
  >
    <template #trigger>
      <span class="item-link" @click="触发跳转">
        {{ 获取物品数据(id)?.名称 || id }}
      </span>
    </template>
    
    <div style="width: 280px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border-radius: 4px;">
      <xiang_qing_ka_pian :id="id" />
    </div>
  </n-popover>
</template>

<script setup>
import { inject } from 'vue';
import { 获取物品数据 } from '@/pei_zhi_shu_ju.js';
// 引入你之前做好的详情卡片
import xiang_qing_ka_pian from '@/components/wu_pin_xi_tong/xiang_qing_ka_pian.vue';

const props = defineProps({
  id: { type: String, required: true }
});

// 接收 App.vue 传来的方法
const 全局跳转 = inject('全局跳转物品');

const 触发跳转 = () => {
  if (全局跳转) {
    全局跳转(props.id);
  }
};
</script>

<style scoped>
.item-link {
  /* 使用深橄榄绿或深森林绿，降低对比度带来的刺眼感 */
  color: #1a7344; 
  cursor: pointer;
  font-weight: 600;
  padding: 0 2px;
  /* 使用细实线，颜色比文字更浅一点，减少视觉干扰 */
  border-bottom: 1px solid #b7dbc7; 
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-block;
  line-height: 1.2;
}

.item-link:hover {
  /* 悬浮时文字颜色稍微加深 */
  color: #0d4d2d;
  /* 增加一个非常淡的绿色背景，增加“可点击”的范围感 */
  background-color: rgba(26, 115, 68, 0.08);
  border-bottom-color: #1a7344;
  border-radius: 3px;
}
</style>