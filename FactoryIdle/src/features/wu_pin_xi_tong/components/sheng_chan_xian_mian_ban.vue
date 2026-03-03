<template>
  <div class="line-panel-container">
    
    <n-card size="small" style="margin-bottom: 16px; border: 1px solid v-bind('themeVars.primaryColor');">
      <template #header>
        <n-text strong>🧠 生产线目标指令</n-text>
      </template>
      <n-select 
        v-model:value="当前目标列表" 
        multiple 
        filterable 
        :options="下拉选项" 
        placeholder="请指派该生产线的最终产物..." 
      />
    </n-card>

    <div v-if="!当前目标列表 || 当前目标列表.length === 0" style="padding-top: 40px;">
      <n-empty description="请设定产品" />
    </div>

    <div v-else>
      <n-card size="small" style="margin-bottom: 16px; background-color: v-bind('themeVars.actionColor');">
        <n-grid :cols="3" :x-gap="12">
          
          <n-grid-item>
            <n-statistic label="硬件负载">
              <n-progress 
                type="line" 
                :percentage="(指标.负载 / 指标.算力上限 * 100) || 0" 
                :show-indicator="false" 
                :status="指标.负载 > 指标.算力上限 ? 'error' : 'success'"
              />
              <div style="font-size: 12px; margin-top: 4px; color: v-bind('themeVars.textColor3');">
                核心 {{ 指标.挂载核心 }} ({{ 格式化数字(指标.负载) }} / {{ 格式化数字(指标.算力上限) }} Hz)
              </div>
            </n-statistic>
          </n-grid-item>

          <n-grid-item>
            <n-statistic label="总能耗" :value="格式化数字(指标.总电力需求)">
              <template #suffix><span style="font-size: 14px;">W</span></template>
            </n-statistic>
          </n-grid-item>

          <n-grid-item>
            <n-statistic label="内存占用" :value="格式化字节(指标.总内存占用)"></n-statistic>
          </n-grid-item>

        </n-grid>

        <n-divider style="margin: 12px 0;" />
        
        <n-flex justify="space-between" align="center" style="margin-bottom: 8px;">
          <n-text depth="3" style="font-size: 12px;">吞吐量 (单位: 个/s)</n-text>
          <n-checkbox v-model:checked="隐藏内部平衡" size="small">隐藏内部平衡</n-checkbox>
        </n-flex>

        <div class="throughput-box">
          <div class="throughput-col">
            <n-text depth="3" style="font-size: 12px; margin-bottom: 4px; display: block;">↓ 原料缺口</n-text>
            <div v-for="item in 消耗列表" :key="item.id" class="throughput-item">
              <wu_pin_chao_lian_jie :id="item.id" />
              <span class="rate-badge rate-neg"> -{{ 格式化数字(item.数量) }} </span>
            </div>
            <n-text v-if="消耗列表.length === 0" depth="4" style="font-size: 12px;">
              {{ 隐藏内部平衡 ? '无缺口 (自给自足)' : '无消耗' }}
            </n-text>
          </div>

          <n-divider vertical style="height: auto; margin: 0 16px;" />

          <div class="throughput-col">
            <n-text depth="3" style="font-size: 12px; margin-bottom: 4px; display: block;">↑ 最终产出</n-text>
            <div v-for="item in 产出列表" :key="item.id" class="throughput-item">
              <wu_pin_chao_lian_jie :id="item.id" />
              <span class="rate-badge rate-pos"> +{{ 格式化数字(item.数量) }} </span>
            </div>
            <n-text v-if="产出列表.length === 0" depth="4" style="font-size: 12px;">停工或无产出</n-text>
          </div>
        </div>
      </n-card>

      <n-collapse :default-expanded-names="展开的面板">
        <n-collapse-item 
          v-for="组 in 分组后的物品列表" 
          :key="组.标题" 
          :title="`${组.标题} (${组.列表.length})`" 
          :name="组.标题"
        >
          <n-flex>
            <wu_pin_ka_pian 
              v-for="物品 in 组.列表" 
              :key="物品.id" 
              :id="物品.id" 
              @action="emit('发送物品id', 物品.id)" 
            />
          </n-flex>
        </n-collapse-item>
      </n-collapse>

    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'; // 🌟 引入 ref
import { useThemeVars } from 'naive-ui';
import Wu_pin_ka_pian from './wu_pin_ka_pian.vue';
import { 获取所有物品列表, 物品类型, 获取所有配方列表 } from '@/shared/pei_zhi_shu_ju.js';
import { 格式化数字, 格式化字节 } from '@/shared/gong_ju.js';

import { use殖民地系统 } from '@/features/zhi_min_di_xi_tong';
import { use生产线系统, use生产线管理 } from '@/features/sheng_chan_xi_tong';

const props = defineProps({
  lineId: { type: String, required: true }
});

const emit = defineEmits(['发送物品id']);

const themeVars = useThemeVars();
const 殖民地系统 = use殖民地系统();
const 生产线系统 = use生产线系统();
const { 
  设置目标物品, 
  获取生产线核心指标, 
  获取生产链白名单, 
  获取纯上游黑名单 
} = use生产线管理();

const cid = computed(() => 殖民地系统.当前视角ID);

// ================= 数据通道 1：目标选择与黑名单 =================
const 当前目标列表 = computed({
  get: () => {
    const line = 生产线系统.数据[cid.value]?.find(l => l.id === props.lineId);
    return line ? line.目标物品ID列表 : [];
  },
  set: (newVal) => {
    设置目标物品(props.lineId, newVal, cid.value);
  }
});

const 纯上游黑名单 = 获取纯上游黑名单(当前目标列表);

const 下拉选项 = computed(() => {
  const 所有配方 = Object.values(获取所有配方列表());
  const 可合成物品ID集 = new Set();
  所有配方.forEach(r => {
    r.输出?.forEach(out => 可合成物品ID集.add(out.id));
  });

  return Object.values(获取所有物品列表())
    .filter(item => 可合成物品ID集.has(item.id))
    .map(item => ({
      label: item.名称,
      value: item.id,
      disabled: 纯上游黑名单.value.has(item.id) 
    }));
});


// ================= 🌟 数据通道 2：仪表盘指标与吞吐量（加入净值计算） =================
const 指标 = 获取生产线核心指标(props.lineId, cid.value);
const 隐藏内部平衡 = ref(true); // 默认开启隐藏

const 消耗列表 = computed(() => {
  const res = [];
  const 吞吐 = 指标.value.物品吞吐;
  for (const [id, data] of Object.entries(吞吐)) {
    let 数量 = data.消耗;
    // 如果开启了隐藏，就用消耗减去产出，算出“净缺口”
    if (隐藏内部平衡.value) {
      数量 = data.消耗 - data.产出;
    }
    // 只有缺口大于0，才需要显示在左侧提示玩家需要外部输入
    if (数量 > 0) res.push({ id, 数量 });
  }
  return res.sort((a, b) => b.数量 - a.数量);
});

const 产出列表 = computed(() => {
  const res = [];
  const 吞吐 = 指标.value.物品吞吐;
  for (const [id, data] of Object.entries(吞吐)) {
    let 数量 = data.产出;
    // 如果开启了隐藏，就用产出减去消耗，算出“净产出”
    if (隐藏内部平衡.value) {
      数量 = data.产出 - data.消耗;
    }
    // 只有净产出大于0，才是这条线真正贡献给整个基地的产物
    if (数量 > 0) res.push({ id, 数量 });
  }
  return res.sort((a, b) => b.数量 - a.数量);
});


// ================= 数据通道 3：白名单与物品卡片 =================
const 生产链白名单 = 获取生产链白名单(当前目标列表);

const 分组后的物品列表 = computed(() => {
  const 分类名称列表 = Object.values(物品类型);
  const 物品数组 = Object.values(获取所有物品列表());

  return 分类名称列表.map(当前分类 => {
    const 物品组 = 物品数组.filter(物品 => 
      物品.类型 === 当前分类 && 生产链白名单.value.includes(物品.id)
    );
    return { 标题: 当前分类, 列表: 物品组 };
  }).filter(组 => 组.列表.length > 0);
});

const 展开的面板 = computed(() => 分组后的物品列表.value.map(组 => 组.标题));
</script>

<style scoped>
.throughput-box {
  display: flex;
  background-color: v-bind('themeVars.inputColor');
  border: 1px solid v-bind('themeVars.borderColor');
  border-radius: 6px;
  padding: 12px;
}

.throughput-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.throughput-item {
  display: flex;
  justify-content: space-between;
  align-items: center; /* 改成 center 让色块垂直居中更好看 */
  padding-right: 16px;
}

/* 🌟 新增的吞吐量徽章样式 */
.rate-badge {
  font-family: 'Fira Code', monospace; /* 等宽字体，数字不对齐治愈强迫症 */
  font-weight: 800;
  font-size: 13px;
  padding: 2px 6px;
  border-radius: 4px;
}

.rate-neg {
  color: v-bind('themeVars.errorColor');
  background-color: rgba(208, 48, 80, 0.1); /* 极淡的红色背景 */
}

.rate-pos {
  color: v-bind('themeVars.successColor');
  background-color: rgba(24, 160, 88, 0.1); /* 极淡的绿色背景 */
}

:deep(.n-collapse-item__header) {
  font-weight: bold;
}
</style>