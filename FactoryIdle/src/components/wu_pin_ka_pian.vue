<template>
  <n-card
    size="small"
    hoverable
    @click="onClick"
    content-style="padding: 8px 20px;"
    style="width: 160px; cursor: pointer;"
    class="物品卡片"
  >
    <n-flex justify="space-between" align="center">
      <n-text strong style="font-size: 20px;">
        {{ 名称 }}
      </n-text>
      
      <n-text 
        :type="速率颜色" 
        depth="3" 
        style="font-size: 14px;"
      >
        {{ 速率文本 }}
      </n-text>
    </n-flex>

    <div style="font-size: 16px; font-weight: bold; line-height: 1.2; margin-top: 4px;">
      {{ 格式化数字(数量) }}
    </div>

  </n-card>
</template>

<script setup>
import { 格式化数字 } from '@/gong_ju';
import { computed } from 'vue';

// 1. 定义组件需要接收的参数
const props = defineProps({
    id: { type: String, required: true },
    名称: { type: String, default: '未知物品' }, // 对应：配置数据.物品.xx.名称
    数量: { type: Number, default: 0 },         // 对应：运行时仓库里的数量
    速率: { type: Number, default: 0 }           // 对应：计算出来的每秒产量
});

// 2. 定义组件向外发送的事件
const emit = defineEmits(['action']);

// 3. 计算属性：处理速率的显示文字 (+10/s 或 -5/s)
const 速率文本 = computed(() => {
  const 速率数值 =Number(props.速率)

  if (props.速率 === 0) return ''; // 没变化就不显示，或者显示 '0/s'

  const 格式化速率 = 格式化数字(Math.abs(速率数值).toFixed(2));

  const sign = props.速率 > 0 ? '+' : '-';

  return `${sign}${格式化速率}/s`;
});

// 4. 计算属性：处理速率的颜色
const 速率颜色 = computed(() => {
  if (props.速率 > 0) return 'success'; // 绿色
  if (props.速率 < 0) return 'error';   // 红色
  return 'default';
});

// 5. 点击处理
const onClick = () => {
  // 把自己的 ID 传出去，告诉父组件“我被点了”
  emit('action', props.id);
};
</script>

<style scoped>
/* 点击缩放效果 */
.物品卡片:active {
  transform: scale(0.98);
  transition: transform 0.1s;
}
</style>