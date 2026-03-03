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
                <n-tag v-else v-for="item in recipe.输入" :key="item.id" size="small" type="info" bordered
                  style="font-size: 12px;">
                  <wu_pin_chao_lian_jie :id="item.id" /> * {{ item.数量 }}
                </n-tag>
              </div>

              <div class="io-arrow">➔</div>

              <div class="io-section">
                <n-tag v-for="item in recipe.输出" :key="item.id" size="medium" type="success"
                  style="font-size: 13px; font-weight: bold;">
                  <wu_pin_chao_lian_jie :id="item.id" /> * {{ item.数量 }}
                </n-tag>
              </div>
            </div>
          </div>

          <n-divider style="margin: 12px 0;" />

          <n-flex justify="space-between" align="center" style="margin-bottom: 16px;">
            <n-text depth="3" style="font-size: 12px;">调整倍率</n-text>
            <n-radio-group v-model:value="倍率" size="small" :disabled="lineId === 'overview'">
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
              
              <n-button-group size="small" v-if="lineId !== 'overview'">
                <n-button @click="尝试减少分配(recipe.id, machineId, 1 * 倍率, 殖民地系统.当前视角ID, lineId)">-</n-button>
                <div class="machine-count-display">
                  {{ 格式化数字(配方分配.查询分配数量(lineId, recipe.id, machineId, 殖民地系统.当前视角ID)) }}
                </div>
                <n-button @click="尝试增加分配(recipe.id, machineId, 1 * 倍率, 殖民地系统.当前视角ID, lineId)">+</n-button>
              </n-button-group>

              <div v-else class="machine-count-display overview-display">
                全线总计: {{ 格式化数字(获取全线机器总数(recipe.id, machineId)) }}
              </div>
            </n-flex>

            <div v-if="lineId !== 'overview' && 配方分配.查询分配数量(lineId, recipe.id, machineId, 殖民地系统.当前视角ID) > 0" class="machine-status-toggle">
              <n-button block size="small" secondary
                :type="配方分配.查询建筑状态(lineId, recipe.id, machineId, 殖民地系统.当前视角ID) === '运行' ? 'success' : 'error'"
                @click="切换状态(recipe.id, machineId, 殖民地系统.当前视角ID, lineId)">
                {{ 配方分配.查询建筑状态(lineId, recipe.id, machineId, 殖民地系统.当前视角ID) === '运行' ? '✅ 运行中' : '⏸ 已停工' }}
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
import { 获取所有配方列表, 获取所有建筑列表 } from '@/shared/pei_zhi_shu_ju.js';
import { 格式化数字 } from '@/shared/gong_ju.js';
import { use库存 } from '@/features/wu_pin_xi_tong'
import { use配方分配 } from '@/features/sheng_chan_xi_tong';
import { useMessage, useThemeVars } from 'naive-ui';
import { use殖民地系统 } from '@/features/zhi_min_di_xi_tong';
import { use建筑调度 } from '@/features/sheng_chan_xi_tong';
import { 全局常量 } from '@/shared/constants';

const { 尝试增加分配, 尝试减少分配, 切换状态 } = use建筑调度();

const themeVars = useThemeVars();
const message = useMessage();
const 配方分配 = use配方分配();
const 库存 = use库存();
const 殖民地系统 = use殖民地系统();

const props = defineProps({
  itemId: { type: String, required: true },
  lineId: { type: String, default: 全局常量.默认产线ID }
});

const 倍率 = ref(1);
const 当前选中配方ID = ref(null);

const 可用配方列表 = computed(() => {
  if (!props.itemId) return [];
  return Object.values(获取所有配方列表()).filter(r =>
    r.输出 && r.输出.some(out => out.id === props.itemId)
  );
});

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

// 🌟 新增：聚合计算当前星球所有生产线的机器分配总和
const 获取全线机器总数 = (配方id, 建筑id) => {
  const cid = 殖民地系统.当前视角ID;
  const 全部线数据 = 配方分配.查询殖民地全部(cid);
  let total = 0;
  for (const lineId in 全部线数据) {
    total += 全部线数据[lineId]?.[配方id]?.[建筑id]?.数量 || 0;
  }
  return total;
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

/* 🌟 看板模式下数字展示框稍微拉宽一点，以容纳文字 */
.overview-display {
  width: auto;
  min-width: 80px;
  padding: 0 12px;
  border-radius: 4px;
  border: 1px solid v-bind('themeVars.borderColor');
  color: v-bind('themeVars.textColor2');
  cursor: not-allowed;
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