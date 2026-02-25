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
          type="primary" 
          :disabled="正在生产"
          @click="开始生产"
        >
          {{ 正在生产 ? '制造中...' : '手动生产' }}
        </n-button>
      </n-flex>
    </template>

    <div v-if="正在生产" style="padding: 0 16px; margin-top: -8px; margin-bottom: 8px;">
      <n-flex justify="space-between" align="center" style="margin-bottom: 2px; font-size: 12px;">
        <n-text depth="3" type="primary">剩余 {{ (剩余时间).toFixed(1) }}s</n-text>
      </n-flex>
      <n-progress type="line" :percentage="进度百分比" :show-indicator="false" status="success" processing style="height: 4px" />
    </div>

    <div style="padding: 8px 16px 16px 16px;">
      
      <n-empty v-if="!id" description="请选择一个物品" />

      <div v-else>
        
        <div style="background-color: #fafafc; border-radius: 6px; padding: 10px 12px; margin-bottom: 12px; border: 1px solid #eef0f5;">
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
                <span :style="{ fontSize: '15px', fontWeight: 'bold', color: 动态信息.速率 > 0 ? '#18a058' : (动态信息.速率 < 0 ? '#d03050' : '') }">
                  {{ 动态信息.速率 > 0 ? '+' : '' }}{{ 格式化数字(动态信息.速率) }}/s
                </span>
              </n-flex>
            </n-grid-item>

            <n-grid-item>
              <n-flex justify="space-between" align="baseline">
                <n-text depth="3" style="font-size: 12px;">产出</n-text>
                <span style="font-size: 13px; color: #18a058;">+{{ 格式化数字(动态信息.产出) }}/s</span>
              </n-flex>
            </n-grid-item>

            <n-grid-item>
              <n-flex justify="space-between" align="baseline">
                <n-text depth="3" style="font-size: 12px;">需求</n-text>
                <span :style="{ fontSize: '13px', color: 动态信息.需求 > 动态信息.产出 ? '#d03050' : '#666' }">
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
            💾 {{ 物品信息.字节 }} 字节
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
        </div>

      </div>
    </div>

  </n-card>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { 获取物品数据, 获取建筑数据, 获取所有配方列表 } from '@/pei_zhi_shu_ju.js';
import { 执行配方生产 } from '@/dong_tai_shu_ju.js';
import { 格式化数字 } from '@/gong_ju.js';
import { use库存 } from '@/stores/ku_cun.js'
import { use全局速率 } from '@/stores/su_lv.js'

const 库存 = use库存();
const 全局速率 = use全局速率()

const props = defineProps({
  id: { type: String, default: null }
});

const 物品信息 = computed(() => props.id ? 获取物品数据(props.id) : {});
const 动态信息 = computed(() => {
  if (!props.id) return { 库存: 0, 速率: 0, 需求: 0, 产出: 0 };
  return {
    库存: 库存.查询库存(props.id),
    速率: 全局速率.查询速率(props.id,'净值'),
    产出: 全局速率.查询速率(props.id,'产出'),
    需求: 全局速率.查询速率(props.id,'需求'),
  };
});

const 生产配方 = computed(() => {
  if (!props.id) return null;
  return Object.values(获取所有配方列表()).find(recipe => {
        if (recipe.类型 === '熔炼') return false;
        return recipe.输出.some(outputItem => outputItem.id === props.id);
    });
});

const 正在生产 = ref(false);
const 进度百分比 = ref(0);
const 剩余时间 = ref(0);
let timer = null;

watch(() => props.id, () => {
  正在生产.value = false;
  进度百分比.value = 0;
  if (timer) clearInterval(timer);
});

const 开始生产 = () => {
  if ( !生产配方.value || 正在生产.value ) return;
  if (!库存.库存检查(生产配方.value.输入, 1)) {
    console.warn("材料不足，无法制造！"); 
    return; 
  }

  const 总耗时秒 = 生产配方.value.时间;
  const 开始时间戳 = Date.now();
  const 预计结束时间戳 = 开始时间戳 + 总耗时秒 *1000; 

  正在生产.value = true;
  剩余时间.value = 总耗时秒;

  timer = setInterval(() => {
    const 当前时间戳 = Date.now();
    const 剩余毫秒 = 预计结束时间戳 - 当前时间戳;
    if (剩余毫秒 <= 0) {
      完成生产(); 
      return;
    }
    剩余时间.value = 剩余毫秒 / 1000;
    const 已经过去毫秒 = (总耗时秒 * 1000) - 剩余毫秒;
    进度百分比.value = 已经过去毫秒 / (总耗时秒 * 1000) * 100;
  }, 50);
};

const 完成生产 = () => {
  if (timer) {
    clearInterval(timer); 
    timer = null;
  }
  正在生产.value = false;
  进度百分比.value = 100; 
  
  const 结果 = 执行配方生产( 生产配方.value.id ); 
  if (!结果.success) console.warn(结果.msg);

  setTimeout(() => { 
    进度百分比.value = 0; 
  }, 200);
};
</script>