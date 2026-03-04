<template>
  <n-card
    v-if="ship"
    size="small"
    hoverable
    class="ship-card"
    @click="onClick"
  >
    <div class="card-header">
      <n-flex align="center" :wrap="false" style="overflow: hidden;">
        <span class="ship-icon">🚀</span>
        <n-text strong class="ship-name" :depth="ship.装备的船体 ? 1 : 3">
          {{ ship.名称 }}
        </n-text>
      </n-flex>
      <n-tag :type="状态颜色" size="small" :bordered="false" style="flex-shrink: 0; font-weight: bold;">
        {{ ship.当前状态 }}
      </n-tag>
    </div>

    <div v-if="!ship.装备的船体" class="empty-hull-warning">
      <n-text depth="3" type="warning" style="font-size: 12px;">
        ⚠️ 未装配船体骨架，无法作业
      </n-text>
    </div>

    <div v-else class="ship-details">
      
      <div class="location-section">
        <n-text v-if="ship.当前状态 === '航行中'" depth="3" class="location-text">
          ➡️ 前往星系: <n-text strong>{{ ship.目标位置 }}</n-text>
        </n-text>
        <n-text v-else depth="3" class="location-text">
          📍 停靠于: <n-text strong>{{ ship.当前位置 }}</n-text>
        </n-text>

        <n-progress 
          v-if="ship.当前状态 === '航行中'" 
          type="line" 
          :percentage="ship.航行进度" 
          :show-indicator="false" 
          status="info" 
          style="height: 4px; margin-top: 4px;" 
        />
      </div>

      <n-divider style="margin: 8px 0;" />

      <div class="cargo-section">
        <n-flex justify="space-between" align="center" style="margin-bottom: 2px;">
          <n-text depth="3" style="font-size: 12px;">货舱负载</n-text>
          <n-text class="cargo-text" :type="容量占比 > 90 ? 'error' : 'default'">
            {{ 格式化字节(已载质量) }} / {{ 格式化字节(最大容量) }}
          </n-text>
        </n-flex>
        <n-progress 
          type="line" 
          :percentage="容量占比" 
          :show-indicator="false" 
          :status="容量占比 > 90 ? 'error' : (容量占比 > 0 ? 'success' : 'default')" 
          style="height: 6px;" 
        />
      </div>

      <div class="hardware-badges">
        <n-tag size="tiny" :bordered="false" type="info">💨 推力: {{ 格式化数字(总推力) }}</n-tag>
        <n-tag size="tiny" :bordered="false" type="warning">🧠 导航: {{ 导航能力 }} 节点</n-tag>
        <n-tag size="tiny" :bordered="false" type="success">📶 带宽: {{ 格式化数字(网卡带宽) }}</n-tag>
      </div>
      
    </div>
  </n-card>
</template>

<script setup>
import { computed } from 'vue';
import { useThemeVars } from 'naive-ui';
import { use飞船实体系统 } from '../store_fei_chuan.js';
import { 格式化字节, 格式化数字 } from '@/shared/gong_ju.js';

const props = defineProps({
  shipId: { type: String, required: true }
});

const emit = defineEmits(['click']);
const themeVars = useThemeVars();
const 飞船库 = use飞船实体系统();

// 基础数据
const ship = computed(() => 飞船库.获取飞船(props.shipId));

// 物理与性能衍生数据
const 已载质量 = computed(() => 飞船库.获取飞船已载质量(props.shipId));
const 最大容量 = computed(() => 飞船库.获取飞船最大容量(props.shipId));
const 总推力 = computed(() => 飞船库.获取飞船总推力(props.shipId));
const 导航能力 = computed(() => 飞船库.获取飞船导航能力(props.shipId));
const 网卡带宽 = computed(() => 飞船库.获取飞船网卡带宽(props.shipId));

const 容量占比 = computed(() => {
  if (最大容量.value <= 0) return 0;
  return Math.min(100, (已载质量.value / 最大容量.value) * 100);
});

// 状态标签颜色映射
const 状态颜色 = computed(() => {
  if (!ship.value) return 'default';
  switch (ship.value.当前状态) {
    case '停泊中': return 'success';
    case '航行中': return 'info';
    case '装卸中': return 'warning';
    case '排队中': return 'error';
    default: return 'default';
  }
});

const onClick = () => {
  emit('click', props.shipId);
};
</script>

<style scoped>
.ship-card {
  width: 260px; /* 固定宽度，方便在列表中排列 */
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid v-bind('themeVars.borderColor');
  position: relative;
}

.ship-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: v-bind('themeVars.primaryColor');
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  gap: 8px;
}

.ship-icon {
  font-size: 16px;
  margin-right: 4px;
}

.ship-name {
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty-hull-warning {
  background-color: rgba(240, 160, 32, 0.1);
  border: 1px dashed #f0a020;
  border-radius: 4px;
  padding: 12px 8px;
  text-align: center;
  margin-top: 8px;
}

.location-text {
  font-size: 12px;
}

.cargo-section {
  margin-bottom: 12px;
}

.cargo-text {
  font-size: 12px;
  font-family: 'Fira Code', monospace; /* 等宽字体让容量数字不跳动 */
}

.hardware-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
</style>