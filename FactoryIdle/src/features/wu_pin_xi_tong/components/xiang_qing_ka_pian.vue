<template>
  <n-card bordered content-style="padding: 0;">
    
    <template #header>
      <n-flex justify="space-between" align="center" style="width: 100%">
        <n-flex align="center" size="small">
          <span style="font-size: 16px; font-weight: bold;">
            {{ 物品信息?.名称 || '未选择' }}
          </span>
          <n-tag v-if="物品信息?.类型" size="small" type="primary" :bordered="false">
            {{ 物品信息.类型 }}
          </n-tag>
        </n-flex>

        <n-button 
          v-if="生产配方" 
          size="small" 
          :type="正在生产此物品 && 任务状态.状态 === '等待空间' ? 'error' : 'primary'"
          :disabled="任务状态.状态 !== '空闲'"
          @click="处理生产点击"
        >
          <template v-if="正在生产此物品">
            {{ 任务状态.状态 === '等待空间' ? '仓储已满' : '制造中...' }}
          </template>
          <template v-else-if="任务状态.状态 !== '空闲'">
            工作台占用
          </template>
          <template v-else>
            手动生产
          </template>
        </n-button>
      </n-flex>
    </template>

    <div v-if="正在生产此物品" style="padding: 0 16px; margin-top: -8px; margin-bottom: 8px;">
      <n-flex justify="space-between" align="center" style="margin-bottom: 2px; font-size: 12px;">
        <n-text depth="3" :type="任务状态.状态 === '等待空间' ? 'error' : 'primary'">
          {{ 任务状态.状态 === '等待空间' ? '等待硬盘空间...' : `剩余 ${任务状态.剩余时间.toFixed(1)}s` }}
        </n-text>
      </n-flex>
      <n-progress 
        type="line" 
        :percentage="任务状态.进度" 
        :show-indicator="false" 
        :status="任务状态.状态 === '等待空间' ? 'error' : 'success'" 
        :processing="任务状态.状态 === '生产中'" 
        style="height: 4px" 
      />
    </div>

    <div style="padding: 8px 16px 16px 16px;">
      
      <n-empty v-if="!id" description="请选择一个物品" />

      <div v-else>
        <div class="info-grid-box">
          <n-grid :cols="2" y-gap="8" x-gap="12">
            
            <n-grid-item>
              <n-flex justify="space-between" align="baseline">
                <n-text depth="3" style="font-size: 12px;">库存</n-text>
                <n-text strong style="font-size: 15px;">{{ 格式化数字(动态信息.库存) }}</n-text>
              </n-flex>
            </n-grid-item>

            <n-grid-item>
              <n-flex justify="space-between" align="baseline">
                <n-text depth="3" style="font-size: 12px;">净值</n-text>
                <span class="rate-text">
                  {{ 动态信息.速率 > 0 ? '+' : '' }}{{ 格式化数字(动态信息.速率) }}/s
                </span>
              </n-flex>
            </n-grid-item>

            <n-grid-item>
              <n-flex justify="space-between" align="baseline">
                <n-text depth="3" style="font-size: 12px;">产出</n-text>
                <span class="produce-text">+{{ 格式化数字(动态信息.产出) }}/s</span>
              </n-flex>
            </n-grid-item>

            <n-grid-item>
              <n-flex justify="space-between" align="baseline">
                <n-text depth="3" style="font-size: 12px;">需求</n-text>
                <span :style="{ fontSize: '13px', color: 动态信息.需求 > 动态信息.产出 ? themeVars.errorColor : themeVars.textColor3 }">
                  -{{ 格式化数字(动态信息.需求) }}/s
                </span>
              </n-flex>
            </n-grid-item>

          </n-grid>
        </div>

        <n-alert v-if="动态信息.需求 > 动态信息.产出 && 动态信息.库存 <= 0" title="产能不足" type="warning" size="small" style="margin-bottom: 12px; padding: 4px 12px;">
          下游机器已降速
        </n-alert>

        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
          <n-tag v-if="物品信息?.字节" size="small" :bordered="false" type="info">
            💾 占用: {{ 物品信息.字节 }} 字节
          </n-tag>
          <n-tag v-if="物品信息?.类型 === '建筑'" size="small" :bordered="false" type="warning">
            ⚙️ 速度: {{ 获取建筑数据(props.id)?.速度 }}
          </n-tag>
          <n-tag v-if="物品信息?.类型 === '建筑' && 获取建筑数据(props.id)?.能耗" size="small" :bordered="false" type="warning">
            ⚡ {{ 格式化数字(获取建筑数据(props.id)?.能耗) }}W
          </n-tag>
          <n-tag v-if="物品信息?.热值" size="small" :bordered="false" type="error">
            🔥 热值: {{ 格式化数字(物品信息?.热值) }}
          </n-tag>
          <n-tag v-if="物品信息?.提供内存" size="small" :bordered="false" type="error">
            内存容量: {{ 格式化字节(物品信息?.提供内存) }}
          </n-tag>
          <n-tag v-if="物品信息?.提供容量" size="small" :bordered="false" type="error">
            硬盘容量: {{ 格式化字节(物品信息?.提供容量) }}
          </n-tag>
        </div>

      </div>
    </div>

  </n-card>
</template>

<script setup>
import { computed } from 'vue';
import { 获取物品数据, 获取建筑数据, 获取所有配方列表 } from '@/shared/pei_zhi_shu_ju.js';
import { 格式化字节, 格式化数字 } from '@/shared/gong_ju.js';
import { use库存 } from '../store.js'
import { use全局速率 } from '@/features/su_lv_xi_tong/store.js'
import { use手动生产 } from '@/features/sheng_chan_xi_tong/composables/shou_dong_sheng_chan.js';
import { useThemeVars } from 'naive-ui';

const themeVars = useThemeVars(); //

const props = defineProps({
  id: { type: String, default: null }
});

const 库存 = use库存();
const 全局速率 = use全局速率();
const { 任务状态, 开始生产 } = use手动生产();

const 物品信息 = computed(() => props.id ? 获取物品数据(props.id) : null);const 动态信息 = computed(() => {
  if (!props.id) return { 库存: 0, 速率: 0, 需求: 0, 产出: 0 };
  return {
    库存: 库存.查询库存(props.id),
    速率: 全局速率.查询速率(props.id, '净值'),
    产出: 全局速率.查询速率(props.id, '产出'),
    需求: 全局速率.查询速率(props.id, '需求'),
  };
});

const 生产配方 = computed(() => {
  if (!props.id) return null;
  return Object.values(获取所有配方列表()).find(recipe => {
    if (recipe.类型 === '熔炼') return false; 
    return recipe.输出.some(outputItem => outputItem.id === props.id);
  });
});

const 正在生产此物品 = computed(() => {
  if (!任务状态.value.当前配方ID || !生产配方.value) return false;
  return 任务状态.value.当前配方ID === 生产配方.value.id;
});

const 处理生产点击 = () => {
  if (生产配方.value) {
    开始生产(生产配方.value.id);
  }
};
</script>

<style scoped>
/* 核心：通过 v-bind 将主题色注入 CSS */
.info-grid-box {
  background-color: v-bind('themeVars.actionColor');
  border: 1px solid v-bind('themeVars.borderColor');
  border-radius: 6px;
  padding: 10px 12px;
  margin-bottom: 12px;
}

.rate-text {
  font-weight: bold;
  font-size: 15px;
  /* 动态颜色也可以在这里写，也可以保留在模板中，但这里更整洁 */
}

.produce-text {
  font-size: 13px; 
  color: v-bind('themeVars.successColor');
}
</style>