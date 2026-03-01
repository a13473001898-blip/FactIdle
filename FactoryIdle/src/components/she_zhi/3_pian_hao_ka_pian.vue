<template>
  <n-card title="⚙️ 游戏偏好" segmented>
    <n-space vertical size="large">
      
      <div>
        <n-flex justify="space-between" align="center" style="margin-bottom: 8px;">
          <n-text strong>自动存档间隔 (秒)</n-text>
          <n-tag :type="游戏设置.自动存档间隔 < 30 ? 'warning' : 'primary'" size="small" :bordered="false">
            {{ 游戏设置.自动存档间隔 }}s
          </n-tag>
        </n-flex>
        <n-input-number 
          v-model:value="游戏设置.自动存档间隔" 
          :min="10" 
          :max="600" 
          :step="10"
          size="small"
        >
          <template #suffix>秒</template>
        </n-input-number>
        <n-text depth="3" style="font-size: 12px; margin-top: 4px; display: block;">
          建议设定在 60 秒以上，过频繁的存档可能会导致低性能设备瞬间卡顿。
        </n-text>
      </div>

      <n-divider style="margin: 8px 0;" />

      <n-flex justify="space-between" align="center">
        <n-text strong>界面刷新模式</n-text>
        <n-radio-group value="fast" size="small">
          <n-radio-button value="fast">高频 (10 FPS)</n-radio-button>
          <n-radio-button value="slow" disabled>节能 (5 FPS)</n-radio-button>
        </n-radio-group>
      </n-flex>

    </n-space>
  </n-card>
</template>

<script setup>
import { use游戏设置 } from '@/stores/she_zhi.js';
const 游戏设置 = use游戏设置();
</script>