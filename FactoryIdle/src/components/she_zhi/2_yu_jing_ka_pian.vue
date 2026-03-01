<template>
  <n-card title="⚠️ 预警系统配置" segmented>
    <template #header-extra>
      <n-text depth="3" style="font-size: 12px;">调节触发颜色警告的阈值</n-text>
    </template>

    <n-space vertical size="large">
      <div v-for="(val, key) in 游戏设置.阈值配置" :key="key" class="threshold-item">
        
        <n-flex justify="space-between" align="center" style="margin-bottom: 8px;">
          <n-flex align="center" :size="4">
            <span>{{ 获取图标(key) }}</span>
            <n-text strong>{{ key }}</n-text>
          </n-flex>
          
          <n-tag 
            size="small" 
            round
            :type="获取标签类型(key, val)"
            :bordered="false"
            style="font-family: monospace; font-weight: bold; width: 50px; justify-content: center;"
          >
            {{ (val * 100).toFixed(0) }}%
          </n-tag>
        </n-flex>

        <n-slider 
          :value="val" 
          :step="0.01" 
          :min="0.05" 
          :max="1" 
          :format-tooltip="(v) => `${(v * 100).toFixed(0)}%`"
          @update:value="(v) => 游戏设置.修改阈值(key, v)" 
        />
      </div>
    </n-space>

    <template #footer>
      <n-text depth="3" style="font-size: 12px;">
        * 设置即时生效。当资源占用超过设定的阈值时，顶部状态栏和计算面板仪表盘将改变颜色。
      </n-text>
    </template>
  </n-card>
</template>

<script setup>
import { use游戏设置 } from '@/stores/she_zhi.js';

const 游戏设置 = use游戏设置();

/**
 * 根据配置名称返回图标，增加辨识度
 */
const 获取图标 = (name) => {
  if (name.includes('内存')) return '🧠';
  if (name.includes('硬盘')) return '💾';
  if (name.includes('能源')) return '⚡';
  return '⚙️';
};

/**
 * 根据名称中的“预警”或“报警”自动分配颜色
 */
const 获取标签类型 = (name, val) => {
  if (name.includes('红色') || name.includes('断供') || name.includes('报警')) {
    return val > 0.5 ? 'error' : 'default';
  }
  if (name.includes('黄色') || name.includes('预警')) {
    return val > 0.5 ? 'warning' : 'default';
  }
  return 'info';
};
</script>

<style scoped>
.threshold-item {
  padding: 8px 4px;
  transition: background-color 0.2s;
  border-radius: 8px;
}

.threshold-item:hover {
  background-color: rgba(0, 0, 0, 0.01);
}
</style>