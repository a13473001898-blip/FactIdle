<template>
  <n-card
    size="small"
    hoverable
    @click="onClick"
    :class="['item-card', 状态类]"
  >
    <div class="card-header">
      <div class="item-name-wrapper">
        <wu_pin_chao_lian_jie :id="id" class="item-name-text" />
      </div>
      
      <div v-if="速率 !== 0" :class="['rate-badge', 速率 > 0 ? 'rate-pos' : 'rate-neg']">
        {{ 速率文本 }}
      </div>
    </div>

    <div class="quantity-display">
      <span class="number">{{ 格式化数字(数量) }}</span>
      <span class="unit" v-if="物品数据?.字节">{{ 物品数据.类型 === '能源' ? '' : '个' }}</span>
    </div>

    </n-card>
</template>

<script setup>
import { computed } from 'vue';
import { use库存 } from '@/stores/ku_cun.js'
import { use全局速率 } from '@/stores/su_lv.js'
import { 获取物品数据 } from '@/pei_zhi_shu_ju.js';
import { 格式化数字 } from '@/gong_ju';
import { useThemeVars } from 'naive-ui';

const themeVars = useThemeVars();

const props = defineProps({
    id: { type: String, required: true }
});

const emit = defineEmits(['action']);

const 库存 = use库存();
const 全局速率 = use全局速率();
const 物品数据 = computed(() => 获取物品数据(props.id));

const 数量 = computed(() => 库存.查询库存(props.id));
const 速率 = computed(() => 全局速率.查询速率(props.id, '净值'));
const 产出 = computed(() => 全局速率.查询速率(props.id, '产出'));
const 需求 = computed(() => 全局速率.查询速率(props.id, '需求'));

// 状态优先级判定逻辑
const 状态类 = computed(() => {
  if (速率.value < 0) return 'status-neg';   // 红色：库存剧减
  if (需求.value > 产出.value) return 'status-warn'; // 黄色：产能缺口
  if (速率.value > 0) return 'status-pos';   // 绿色：稳步增长
  return 'status-neu';                       // 灰色：平衡/停产
});

const 速率文本 = computed(() => {
  if (速率.value === 0) return '';
  const sign = 速率.value > 0 ? '+' : '';
  return `${sign}${格式化数字(速率.value)}/s`;
});

const onClick = () => {
  emit('action', props.id);
};
</script>

<style scoped>
.item-card {
  width: 180px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: v-bind('themeVars.borderColor');
  position: relative;
  /* 重点：保留左侧状态条 */
  border-left: 5px solid #d1d1d1;
  /* 适当减小 padding 让卡片更精致 */
  padding: 4px 0; 
}

/* 状态颜色：背景色做了极淡化处理，主要靠边框发力 */
.status-pos { border-left-color: #18a058; background-color: rgba(24, 160, 88, 0.03); }
.status-neg { border-left-color: #d03050; background-color: rgba(208, 48, 80, 0.03); }
.status-warn { border-left-color: #f0a020; background-color: rgba(240, 160, 32, 0.03); }
.status-neu { border-left-color: v-bind('themeVars.dividerColor'); background-color: v-bind('themeVars.actionColor'); }

.item-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  border-color: v-bind('themeVars.primaryColor');
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 4px;
  margin-bottom: 6px;
}

.item-name-wrapper {
  flex: 1;
  min-width: 0;
}

/* 强制名称不换行并显示省略号 */
:deep(.item-name-text) {
  font-size: 13px !important;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  border-bottom: none !important;
  color: v-bind('themeVars.textColor2');
}

.rate-badge {
  font-size: 10px;
  padding: 0 5px;
  border-radius: 3px;
  font-weight: bold;
  white-space: nowrap;
  font-family: 'Fira Code', monospace;
}

.rate-pos { background: #18a058; color: white; }
.rate-neg { background: #d03050; color: white; }

.quantity-display {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.number {
  font-size: 20px;
  font-weight: 800;
  color: v-bind('themeVars.textColor1');
  /* 使用等宽数字防止跳动 */
  font-variant-numeric: tabular-nums;
}

.unit {
  font-size: 11px;
  color: #999;
}
</style>