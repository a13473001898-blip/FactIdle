<template>
  <n-card size="small" content-style="padding: 0;">

    <n-empty v-if="可用配方列表.length === 0" description="该物品不可自动化生产" style="padding: 32px 16px;" />

    <n-tabs v-else v-model:value="当前选中配方ID" type="segment" size="small" style="padding: 8px;">

      <n-tab-pane v-for="recipe in 可用配方列表" :key="recipe.id" :name="recipe.id" :tab="recipe.类型">
        <div style="padding: 8px 12px 16px 12px;">

          <div style="background-color: #f8f8fa; border-radius: 8px; padding: 16px; margin-bottom: 16px; border: 1px solid #eef0f5;">
            
            <n-flex justify="space-between" align="center" style="margin-bottom: 12px;">
              <n-text strong style="font-size: 13px; color: #666;">合成配方</n-text>
              <n-tag size="small" type="warning" :bordered="false" style="font-weight: bold;">
                ⏳ {{ recipe.时间 }}s
              </n-tag>
            </n-flex>

            <div style="display: flex; align-items: center; gap: 12px; min-height: 40px;">
              
              <div style="flex: 1; display: flex; flex-wrap: wrap; gap: 6px;">
                <n-text v-if="!recipe.输入 || recipe.输入.length === 0" depth="3" style="font-size: 13px;">无消耗</n-text>
                
                <n-tag 
                  v-else 
                  v-for="item in recipe.输入" 
                  :key="item.id" 
                  size="small" 
                  type="info" 
                  bordered
                  style="font-size: 12px;"
                >
                  <wu_pin_chao_lian_jie :id="item.id" /> * {{ item.数量 }}
                </n-tag>
              </div>

              <div style="flex-shrink: 0; color: #18a058; font-size: 20px; font-weight: bold;">
                ➔
              </div>

              <div style="flex-shrink: 0; display: flex; flex-direction: column; gap: 6px;">
                <n-tag 
                  v-for="item in recipe.输出" 
                  :key="item.id" 
                  size="medium" 
                  type="success" 
                  style="font-size: 13px; font-weight: bold;"
                >
                  <wu_pin_chao_lian_jie :id="item.id" /> * {{ item.数量 }}
                </n-tag>
              </div>

            </div>
          </div>

          <n-divider style="margin: 12px 0;" />

          <n-flex justify="space-between" align="center" style="margin-bottom: 16px;">
            <n-radio-group v-model:value="倍率" size="small">
              <n-radio-button :value="1">x1</n-radio-button>
              <n-radio-button :value="10">x10</n-radio-button>
              <n-radio-button :value="100">x100</n-radio-button>
              <n-radio-button :value="1000">x1000</n-radio-button>
            </n-radio-group>
          </n-flex>

          <div v-for="machineId in 获取可用机器ID列表(recipe.类型)" :key="machineId"
            style="margin-bottom: 12px; border: 1px solid #eef0f5; border-radius: 8px; padding: 12px; background-color: #fafafc; transition: all 0.2s;">
            
            <n-flex justify="space-between" align="center" style="margin-bottom: 12px;">
              <n-text strong style="font-size: 15px;">
                <wu_pin_chao_lian_jie :id="machineId" />
              </n-text>
              <n-tag size="small" :bordered="false" type="info">
                空闲: {{ Math.floor(库存.查询库存(machineId)) }}
              </n-tag>
            </n-flex>

            <n-flex justify="space-between" align="center">
              <n-text depth="3" style="font-size: 13px;">分配数量</n-text>
              <n-button-group size="small">
                <n-button @click="配方分配.减少分配数量(recipe.id, machineId, 1 * 倍率)" style="width: 36px; font-weight: bold;">-</n-button>
                <div style="width: 60px; flex-shrink: 0; background: white; border-top: 1px solid #e0e0e6; border-bottom: 1px solid #e0e0e6; display: flex; align-items: center; justify-content: center; font-weight: bold; font-family: monospace; font-size: 14px;">
                  {{ 格式化数字(配方分配.查询分配数量(recipe.id, machineId)) }}
                </div>
                <n-button @click="尝试增加分配(recipe.id, machineId, 1 * 倍率)" style="width: 36px; font-weight: bold;">+</n-button>
              </n-button-group>
            </n-flex>

            <div v-if="配方分配.查询分配数量(recipe.id, machineId) > 0" style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed #e5e5e5;">
              <n-button 
                block 
                size="small" 
                secondary
                :type="配方分配.查询建筑状态(recipe.id, machineId) === '运行' ? 'success' : 'error'"
                @click="配方分配.切换建筑状态(recipe.id, machineId)"
              >
                {{ 配方分配.查询建筑状态(recipe.id, machineId) === '运行' ? '✅ 运行中 (点击停工)' : '⏸ 已停工 (点击恢复)' }}
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
// 移除了用不到的格式化字符串函数
import { 获取所有配方列表, 获取所有建筑列表, 获取物品数据, 物品ID } from '@/pei_zhi_shu_ju.js';
import { 格式化数字 } from '@/gong_ju.js';
import { use库存 } from '@/stores/ku_cun.js'
import { use配方分配 } from '@/stores/pei_fang_fen_pei.js';
import Wu_pin_chao_lian_jie from '../tong_yong/wu_pin_chao_lian_jie.vue';

const 配方分配 = use配方分配();
const 库存 = use库存();

const props = defineProps(['itemId']);

const 倍率 = ref(1);
const 当前选中配方ID = ref(null);

const 可用配方列表 = computed(() => {
  if (!props.itemId) return [];
  return Object.values(获取所有配方列表()).filter(r =>
    r.输出 && r.输出.some(out => out.id === props.itemId)
  );
});

watch(可用配方列表, (newList) => {
  if (newList && newList.length > 0) {
    当前选中配方ID.value = newList[0].id;
  } else {
    当前选中配方ID.value = null;
  }
}, { immediate: true });

const 获取可用机器ID列表 = (类型) => {
  return Object.values(获取所有建筑列表())
    .filter(b => b.类型 === 类型)
    .map(b => b.id);
};

import { useMessage } from 'naive-ui';
const message = useMessage();

// 新建一个拦截验证函数
const 尝试增加分配 = (配方id, 建筑id, 期望数量) => {
    const 之前数量 = 配方分配.查询分配数量(配方id, 建筑id);
    const 拦截结果 = 配方分配.增加分配数量(配方id, 建筑id, 期望数量);
    const 之后数量 = 配方分配.查询分配数量(配方id, 建筑id);
    
    // 如果返回false或者实际增加的比期望的少，且库存还有货，说明是算力不够被拦了
    if (拦截结果 === false || (之后数量 - 之前数量 < 期望数量 && 库存.查询库存(建筑id) > 0)) {
        message.warning('内存算力已达上限！请前往计算中心扩展阵列。');
    }
};
</script>

<style scoped>
:deep(.n-tabs-nav) {
  background-color: transparent !important;
}
</style>