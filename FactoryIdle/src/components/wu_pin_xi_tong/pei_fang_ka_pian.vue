<template>
  <n-card size="small" content-style="padding: 0;">
    <n-empty v-if="可用配方列表.length === 0" description="该物品不可自动化生产" style="padding: 32px 16px;" />

    <n-tabs v-else v-model:value="当前选中配方ID" type="segment" size="small" style="padding: 8px;">
      <n-tab-pane v-for="recipe in 可用配方列表" :key="recipe.id" :name="recipe.id" :tab="recipe.类型">
        <div style="padding: 8px 12px 16px 12px;">

          <div class="recipe-header-box">
            <n-flex justify="space-between" align="center" style="margin-bottom: 12px;">
              <n-text strong depth="3" style="font-size: 13px;">合成配方</n-text>
              <n-tag size="small" type="warning" :bordered="false" style="font-weight: bold;">
                ⏳ {{ recipe.时间 }}s
              </n-tag>
            </n-flex>

            <div class="recipe-io-display">
              <div class="io-section">
                <n-text v-if="!recipe.输入 || recipe.输入.length === 0" depth="3" style="font-size: 13px;">无消耗</n-text>
                <n-tag v-else v-for="item in recipe.输入" :key="item.id" size="small" type="info" bordered style="font-size: 12px;">
                  <wu_pin_chao_lian_jie :id="item.id" /> * {{ item.数量 }}
                </n-tag>
              </div>

              <div class="io-arrow">➔</div>

              <div class="io-section">
                <n-tag v-for="item in recipe.输出" :key="item.id" size="medium" type="success" style="font-size: 13px; font-weight: bold;">
                  <wu_pin_chao_lian_jie :id="item.id" /> * {{ item.数量 }}
                </n-tag>
              </div>
            </div>
          </div>

          <n-divider style="margin: 12px 0;" />

          <n-flex justify="space-between" align="center" style="margin-bottom: 16px;">
            <n-text depth="3" style="font-size: 12px;">调整倍率</n-text>
            <n-radio-group v-model:value="倍率" size="small">
              <n-radio-button :value="1">x1</n-radio-button>
              <n-radio-button :value="10">x10</n-radio-button>
              <n-radio-button :value="100">x100</n-radio-button>
              <n-radio-button :value="1000">x1000</n-radio-button>
            </n-radio-group>
          </n-flex>

          <div v-for="machineId in 获取可用机器ID列表(recipe.类型)" :key="machineId" class="machine-config-item">
            <n-flex justify="space-between" align="center" style="margin-bottom: 12px;">
              <n-text strong style="font-size: 14px;">
                <wu_pin_chao_lian_jie :id="machineId" />
              </n-text>
              <n-tag size="small" :bordered="false" type="info">
                库存: {{ Math.floor(库存.查询库存(machineId)) }}
              </n-tag>
            </n-flex>

            <n-flex justify="space-between" align="center">
              <n-text depth="3" style="font-size: 13px;">已分配</n-text>
              <n-button-group size="small">
                <n-button @click="配方分配.减少分配数量(recipe.id, machineId, 1 * 倍率)">-</n-button>
                <div class="machine-count-display">
                  {{ 格式化数字(配方分配.查询分配数量(recipe.id, machineId)) }}
                </div>
                <n-button @click="尝试增加分配(recipe.id, machineId, 1 * 倍率)">+</n-button>
              </n-button-group>
            </n-flex>

            <div v-if="配方分配.查询分配数量(recipe.id, machineId) > 0" class="machine-status-toggle">
              <n-button block size="small" secondary
                :type="配方分配.查询建筑状态(recipe.id, machineId) === '运行' ? 'success' : 'error'"
                @click="配方分配.切换建筑状态(recipe.id, machineId)">
                {{ 配方分配.查询建筑状态(recipe.id, machineId) === '运行' ? '✅ 运行中' : '⏸ 已停工' }}
              </n-button>
            </div>
          </div>

        </div>
      </n-tab-pane>
    </n-tabs>
  </n-card>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { 获取所有配方列表, 获取所有建筑列表 } from '@/pei_zhi_shu_ju.js';
import { 格式化数字 } from '@/gong_ju.js';
import { use库存 } from '@/stores/ku_cun.js'
import { use配方分配 } from '@/stores/pei_fang_fen_pei.js';
import { useMessage, useThemeVars } from 'naive-ui';

const themeVars = useThemeVars();
const message = useMessage();
const 配方分配 = use配方分配();
const 库存 = use库存();

const props = defineProps(['itemId']);
const 倍率 = ref(1);
const 当前选中配方ID = ref(null);

// 数据计算逻辑
const 可用配方列表 = computed(() => {
  if (!props.itemId) return [];
  return Object.values(获取所有配方列表()).filter(r =>
    r.输出 && r.输出.some(out => out.id === props.itemId)
  );
});

// 监听 ID 变化自动切标签
watch(() => props.itemId, () => {
  if (可用配方列表.value.length > 0) {
    当前选中配方ID.value = 可用配方列表.value[0].id;
  }
}, { immediate: true });

const 获取可用机器ID列表 = (类型) => {
  return Object.values(获取所有建筑列表())
    .filter(b => b.类型 === 类型)
    .map(b => b.id);
};

// 内存拦截验证逻辑
const 尝试增加分配 = (配方id, 建筑id, 期望数量) => {
  const 之前数量 = 配方分配.查询分配数量(配方id, 建筑id);
  const 拦截结果 = 配方分配.增加分配数量(配方id, 建筑id, 期望数量);
  const 之后数量 = 配方分配.查询分配数量(配方id, 建筑id);

  if (拦截结果 === false || (之后数量 - 之前数量 < 期望数量 && 库存.查询库存(建筑id) > 0)) {
    message.warning('算力/内存不足！请检查殖民地计算中心。');
  }
};
</script>

<style scoped>
/* 配方头部区域 */
.recipe-header-box {
  background-color: v-bind('themeVars.inputColor');
  border: 1px solid v-bind('themeVars.borderColor');
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
}

.recipe-io-display {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 40px;
}

.io-section {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.io-arrow {
  flex-shrink: 0;
  color: v-bind('themeVars.successColor');
  font-size: 18px;
  font-weight: bold;
}

/* 机器配置项 */
.machine-config-item {
  margin-bottom: 12px;
  border: 1px solid v-bind('themeVars.borderColor');
  border-radius: 8px;
  padding: 12px;
  background-color: v-bind('themeVars.actionColor');
  transition: all 0.2s;
}

.machine-count-display {
  width: 64px;
  flex-shrink: 0;
  background-color: v-bind('themeVars.cardColor');
  border-top: 1px solid v-bind('themeVars.borderColor');
  border-bottom: 1px solid v-bind('themeVars.borderColor');
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-family: 'Fira Code', monospace;
  font-size: 14px;
  color: v-bind('themeVars.primaryColor');
}

.machine-status-toggle {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed v-bind('themeVars.dividerColor');
}

:deep(.n-tabs-nav) {
  background-color: transparent !important;
}
</style>