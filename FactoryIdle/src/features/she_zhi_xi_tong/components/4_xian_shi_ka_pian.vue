<template>
  <n-card title="🖥️ 显示与视觉" segmented>
    <n-space vertical size="large">
      
      <n-flex justify="space-between" align="center">
        <n-text strong>数值格式化模式</n-text>
        <n-select 
          style="width: 160px;"
          :value="显示配置.数字模式" 
          :options="数字模式选项" 
          @update:value="v => 更新('数字模式', v)"
        />
      </n-flex>

      <div>
        <n-flex justify="space-between" style="margin-bottom: 8px;">
          <n-text strong>显示精度 (小数位)</n-text>
          <n-tag size="small" :bordered="false">{{ 显示配置.保留小数 }} 位</n-tag>
        </n-flex>
        <n-slider 
          :value="显示配置.保留小数" 
          :min="0" :max="4" :step="1"
          @update:value="v => 更新('保留小数', v)"
        />
      </div>

      <n-divider />

      <n-flex justify="space-between" align="center">
        <n-text strong>视觉主题</n-text>
        <n-radio-group 
          :value="显示配置.主题模式" 
          @update:value="v => 更新('主题模式', v)"
          name="theme-group"
        >
          <n-radio-button value="light">明亮</n-radio-button>
          <n-radio-button value="dark">深色</n-radio-button>
          <n-radio-button value="auto">自动</n-radio-button>
        </n-radio-group>
      </n-flex>

      <n-flex justify="space-between" align="center">
        <n-text strong>高对比度模式</n-text>
        <n-switch 
          :value="显示配置.高对比度" 
          @update:value="v => 更新('高对比度', v)" 
        />
      </n-flex>

    </n-space>
  </n-card>
</template>

<script setup>
import { computed } from 'vue';
import { use游戏设置 } from '../store.js';

const 游戏设置 = use游戏设置();
const 显示配置 = computed(() => 游戏设置.显示配置);

const 更新 = (key, val) => 游戏设置.更新显示设置(key, val);

const 数字模式选项 = [
  { label: '标准 (K, M, B)', value: 'standard' },
  { label: '科学计数 (1.2e9)', value: 'scientific' },
  { label: '工程计数 (120e6)', value: 'engineering' },
];
</script>