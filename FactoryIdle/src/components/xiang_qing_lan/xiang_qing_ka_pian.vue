<template>
  <n-card bordered content-style="padding: 0;">
    
    <template #header>
      <n-flex justify="space-between" align="center" style="width: 100%">
        
        <n-flex align="center" size="small">
          <span style="font-size: 18px; font-weight: bold;">
            {{ 物品信息?.名称 || '未选择' }}
          </span>
          <n-tag v-if="物品信息?.类型" size="small" type="primary" bordered>
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
          {{ 正在生产 ? `剩余 ${(剩余时间).toFixed(1)}s` : '手动生产' }}
        </n-button>

      </n-flex>
    </template>

    <div v-if="正在生产" style="padding: 0 24px; margin-top: -12px; margin-bottom: 12px;">
      <n-progress 
        type="line" 
        :percentage="进度百分比" 
        :show-indicator="false" 
        status="success" 
        processing
        style="height: 4px"
      />
    </div>

    <div style="padding: 24px;">
      
      <n-empty v-if="!id" description="请选择一个物品" />

      <div v-else>
        <n-row gutter="12">
          <n-col :span="12">
            <n-statistic label="库存">
              {{ 格式化数字(动态信息.库存) }}
            </n-statistic>
          </n-col>
          <n-col :span="12">
            <n-statistic label="产出">
              <template #suffix>/s</template>
              <span :style="{ color: 动态信息.速率 > 0 ? '#18a058' : (动态信息.速率 < 0 ? '#d03050' : '') }">
                {{ 动态信息.速率 > 0 ? '+' : '' }}{{ 格式化数字(动态信息.速率) }}
              </span>
            </n-statistic>
          </n-col>
        </n-row>

        <n-divider />

        <n-text depth="3" style="font-size: 12px;">
          占用空间: {{ 物品信息?.字节 }} 字节<br>
          生产耗时: {{ 获取配方数据(props.id + '_r')?.时间 }}秒
        </n-text>

        <n-divider v-if="物品信息?.类型 === '建筑'" />

        <n-text v-if="物品信息?.类型 === '建筑'" style="font-size: 12px;">
          速度:{{ 获取建筑数据(props.id)?.速度 }}<br>
          能耗: {{ 格式化数字(获取建筑数据(props.id)?.能耗) }} W/s

        </n-text>

        <n-divider v-if="物品信息?.热值" />

        <n-text v-if="物品信息?.热值" style="font-size: 12px;">
          热值:{{ 格式化数字(物品信息?.热值) }}w

        </n-text>


      </div>
    </div>

  </n-card>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
// 引入数据源
import { 获取物品数据, 获取配方数据, 获取建筑数据, 获取所有配方列表} from '../../pei_zhi_shu_ju.js';
import { 查询库存, 查询速率, } from '../../dong_tai_shu_ju.js';
import { 执行配方生产 } from '../../dong_tai_shu_ju.js';
import { 格式化数字 } from '@/gong_ju.js';

const props = defineProps({
  id: { type: String, default: null }
});

// --- 基础信息查询 ---



const 物品信息 = computed(() => props.id ? 获取物品数据(props.id) : {});
const 动态信息 = computed(() => {
  if (!props.id) return { 库存: 0, 速率: 0 };
  return {
    库存: 查询库存(props.id),
    速率: 查询速率(props.id,'净值')
  };
});

// --- 查找生产配方 ---
const 生产配方 = computed(() => {
  if (!props.id) return null;
  
  // 遍历配方配置对象的值
  return Object.values(获取所有配方列表()).find(recipe => {
        if (recipe.类型 === '熔炼') {
            return false
        }
        return recipe.输出.some(outputItem => outputItem.id === props.id);
    });
});

// --- 新增逻辑：采集进度控制 ---
const 正在生产 = ref(false);
const 进度百分比 = ref(0);
const 剩余时间 = ref(0);
let timer = null; // 计时器变量

// 监听 ID 变化，如果切换了物品，要重置采集状态
watch(() => props.id, () => {
  正在生产.value = false;
  进度百分比.value = 0;
  if (timer) clearInterval(timer);
});

const 开始生产 = () => {
  // 1. 第一步：防御性判断
  // 如果没有配方，或者已经在生产了，直接 return
  if ( !生产配方.value || 正在生产.value ) return;

  // 2. 第二步：计算时间锚点
  // 拿到总耗时（秒），算出开始时间戳和预计结束时间戳
  const 总耗时秒 = 生产配方.value.时间;
  const 开始时间戳 = Date.now();
  const 预计结束时间戳 = 开始时间戳 + 总耗时秒 *1000; // 这里怎么算？

  // 3. 第三步：初始化状态
  正在生产.value = true;
  剩余时间.value = 总耗时秒;

  // 4. 第四步：启动计时器
  timer = setInterval(() => {
    // 算出距离结束还差多少毫秒
    const 当前时间戳 = Date.now();
    const 剩余毫秒 = 预计结束时间戳 - 当前时间戳;

    // A. 判断结束：如果剩余毫秒 <= 0
    if (剩余毫秒 <= 0) {
      // 执行完成函数并退出
      完成生产(); 

      return;
    }

    // B. 更新 UI 数据
    // 剩余时间（秒）
    剩余时间.value = 剩余毫秒 / 1000;
    
    // 进度百分比 (0-100)
    // 公式：(总时间 - 剩余时间) / 总时间
    const 已经过去毫秒 = (总耗时秒 * 1000) - 剩余毫秒;
    进度百分比.value = 已经过去毫秒 / (总耗时秒 * 1000) * 100;

  }, 50);
};

const 完成生产 = () => {
  // 1. 第一步：停止计时器
  if (timer) {
    clearInterval(timer); 
    timer = null;
  }
  
  // 2. 第二步：更新 UI 状态
  正在生产.value = false;
  进度百分比.value = 100; 
  
  // 3. 第三步：执行生产
  const 结果 = 执行配方生产( 生产配方.value.id ); 
  
  if (!结果.success) {
    console.warn(结果.msg);
  }

  // 4. 第五步：视觉复位
  // 延迟 200毫秒 后，把进度条归零，准备下一次
  setTimeout(() => { 
    进度百分比.value = 0; 
  }, 1);
};


</script>