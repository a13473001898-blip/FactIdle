<template>
  <n-popover trigger="hover" placement="right" :keep-alive-on-hover="true" style="padding: 0; background: transparent; box-shadow: none;">
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
import { inject, unref } from 'vue';
import { 获取物品数据 } from '@/shared/pei_zhi_shu_ju.js';
import { xiang_qing_ka_pian } from '@/features/wu_pin_xi_tong/index.js';
import { useThemeVars } from 'naive-ui';

const themeVars = useThemeVars();
const props = defineProps({
  id: { type: String, required: true }
});

const 全局跳转 = inject('全局跳转物品');
// 🌟 核心修复：注入当前环境的线 ID，如果没有则默认为散装区
const 当前线路ID = inject('当前线路ID', 'default');

const 触发跳转 = () => {
  if (全局跳转) {
    // 带着线 ID 一起跳，防止迷路
    全局跳转(props.id, unref(当前线路ID));
  }
};
</script>

<style scoped>
.item-link { color: v-bind('themeVars.primaryColor'); cursor: pointer; font-weight: 600; padding: 0 2px; border-bottom: 1px solid v-bind('themeVars.primaryColorSuppl'); transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); display: inline-block; line-height: 1.2; }
.item-link:hover { color: #0d4d2d; background-color: rgba(26, 115, 68, 0.08); border-bottom-color: #1a7344; border-radius: 3px; }
</style>