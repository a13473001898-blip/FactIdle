<template>
  <n-card size="small" content-style="padding: 0;">
    
    <n-empty v-if="可用配方列表.length === 0" description="不可自动化" style="padding: 24px;" />

    <n-tabs v-else v-model:value="当前选中配方ID" type="card" size="small">
      
      <n-tab-pane 
        v-for="recipe in 可用配方列表" 
        :key="recipe.id" 
        :name="recipe.id" 
        :tab="recipe.类型"
      >
        <div style="padding: 16px;">
          
          <div style="margin-bottom: 16px; background-color: #f5f7fa; padding: 12px; border-radius: 8px;">
            <n-flex justify="space-between" align="center" style="margin-bottom: 8px;">
               <n-radio-group v-model:value="倍率" size="tiny">
                  <n-radio-button :value="1">x1</n-radio-button>
                  <n-radio-button :value="10">x10</n-radio-button>
                  <n-radio-button :value="100">x100</n-radio-button>
                  <n-radio-button :value="1000">x1000</n-radio-button>
                  </n-radio-group>
            </n-flex>
            
            <n-flex justify="space-between" style="font-size: 12px;">
               <n-tag size="small" :bordered="false" type="warning">
                 耗时: {{ recipe.时间 }}s
               </n-tag>
               <n-text depth="3">
                 {{ 格式化配方物品(recipe.输入) }} 
                 <span style="margin: 0 4px;">⮕</span> 
                 {{ 格式化配方物品(recipe.输出) }}
               </n-text>
            </n-flex>
          </div>

          <div 
             v-for="machineId in 获取可用机器ID列表(recipe.类型)" 
             :key="machineId"
             style="margin-bottom: 12px; border: 1px solid #eee; border-radius: 8px; padding: 12px;"
          >
            <n-flex justify="space-between" align="center" style="margin-bottom: 12px;">
               <n-text strong style="font-size: 15px;">
                 {{ 获取物品数据(machineId).名称 }}
               </n-text>
               <n-tag size="small" :bordered="false" type="info">
                 空闲: {{ Math.floor(查询库存(machineId)) }}
               </n-tag>
            </n-flex>

            <n-flex justify="space-between" align="center">
              
              <div style="width: 80px;"> <n-button 
                  v-if="查询配方分配数量(recipe.id, machineId) > 0"
                  size="small"
                  secondary
                  :type="查询配方建筑状态(recipe.id, machineId) === '运行' ? 'success' : 'error'"
                  @click="切换建筑状态(recipe.id, machineId)"
                  style="width: 100%;"
                >
                  {{ 查询配方建筑状态(recipe.id, machineId) === '运行' ? '运行中' : '已停工' }}
                </n-button>
              </div>

              <n-button-group size="small">
                <n-button @click="减少配方分配建筑数量(recipe.id, machineId, 1*倍率)">-</n-button>
                <div style="min-width: 40px; padding: 0 8px; background: white; border: 1px solid #eee; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                   {{ 格式化数字(查询配方分配数量(recipe.id, machineId)) }}
                </div>
                <n-button @click="增加配方分配建筑数量(recipe.id, machineId, 1*倍率)">+</n-button>
              </n-button-group>

            </n-flex>

          </div>

        </div>
      </n-tab-pane>

    </n-tabs>
  </n-card>
</template>

<script setup>
import { computed,ref,watch} from 'vue';
import { 获取所有配方列表, 获取所有建筑列表, 获取物品数据 } from '../../pei_zhi_shu_ju.js';
import {增加配方分配建筑数量,减少配方分配建筑数量, 查询配方分配数量, 查询库存,查询配方建筑状态,切换建筑状态 } from '@/dong_tai_shu_ju.js';
import { 格式化数字 } from '@/gong_ju.js';


const props = defineProps(['itemId']);

const 倍率 = ref(1);
const 当前选中配方ID = ref(null);

// --- 1. 找出当前物品对应的配方列表 ---
const 可用配方列表 = computed(() => {
  if (!props.itemId) return [];
  // 逻辑：遍历所有配方，返回输出包含 props.itemId 的配方
  return Object.values(获取所有配方列表()).filter(r => 
      r.输出 && r.输出.some(out => out.id === props.itemId)
  );
});

watch(可用配方列表, (newList) => {
  // 如果新列表里有配方
  if (newList && newList.length > 0) {
    // 把第一个配方的 ID 赋值给选中变量，这样 UI 就会自动跳过去了
    当前选中配方ID.value = newList[0].id;
  } else {
    当前选中配方ID.value = null;
  }
}, { immediate: true });

// --- 2. 找出某种类型（如'熔炼'）对应的机器 ID ---
const 获取可用机器ID列表 = (类型) => {
  return Object.values(获取所有建筑列表())
      .filter(b => b.类型 === 类型)
      .map(b => b.id);
};

  const 格式化配方物品 = (list) => {
    if (!list || list.length === 0) return '无';
  
    return list.map(item => {
        // 去物品配置里查名字，查不到就显示 ID 兜底
        const 名称 = 获取物品数据(item.id)?.名称 || item.id;
        return `${名称}x${item.数量}`;
    }).join(', '); // 最后用逗号把它们连成一个字符串
  };

</script>