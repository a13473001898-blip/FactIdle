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
          
          <n-flex justify="space-between" align="center" style="margin-bottom: 12px;">
             <n-text depth="3" style="font-size: 12px;">耗时: {{ recipe.时间 }}s</n-text>
             <n-text depth="3" style="font-size: 12px;">输出: {{格式化配方物品(recipe.输出) }}</n-text>
             <n-text depth="3" style="font-size: 12px;">输入: {{格式化配方物品(recipe.输入) }}</n-text>
             <n-radio-group v-model:value="倍率" size="tiny">
                <n-radio-button :value="1">x1</n-radio-button>
                <n-radio-button :value="5">x5</n-radio-button>
                <n-radio-button :value="10">x10</n-radio-button>
                <n-radio-button :value="50">x50</n-radio-button>
                <n-radio-button :value="100">x100</n-radio-button>
             </n-radio-group>
          </n-flex>

          <div 
             v-for="machineId in 获取可用机器ID列表(recipe.类型)" 
             :key="machineId"
             style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; background: #f9f9f9; padding: 8px; border-radius: 4px;"
          >
            <div>
               <n-text strong>{{ 物品配置[machineId].名称 }}</n-text>
               <n-text depth="3" style="font-size: 12px; margin-left: 8px;">
                 (空闲: {{ Math.floor(游戏数据.库存[machineId] || 0) }})
               </n-text>
            </div>

            <!-- 分配建筑 -->
            <n-button-group size="tiny">
              <n-button @click="调整建筑分配数量(recipe.id, machineId, -1)">-</n-button>
              
              <div style="padding: 0 12px; background: white; border: 1px solid #eee; display: flex; align-items: center; justify-content: center;">
                 {{ 格式化数字(游戏数据.配方分配[recipe.id]?.[machineId]?.数量) || 0 }}
              </div>
              
              <n-button @click="调整建筑分配数量(recipe.id, machineId, 1)">+</n-button>
            </n-button-group>

          </div>

        </div>
      </n-tab-pane>

    </n-tabs>
  </n-card>
</template>

<script setup>
import { computed,ref,watch} from 'vue';
import { 物品 as 物品配置, 配方 as 配方配置, 建筑 as 建筑配置 } from '../../pei_zhi_shu_ju.js';
import { 游戏数据 } from '../../dong_tai_shu_ju.js';
import { 格式化数字 } from '@/gong_ju.js';

const props = defineProps(['itemId']);

const 倍率 = ref(1);
const 当前选中配方ID = ref(null);

// --- 1. 找出当前物品对应的配方列表 ---
const 可用配方列表 = computed(() => {
  if (!props.itemId) return [];
  // 逻辑：遍历所有配方，返回输出包含 props.itemId 的配方
  return Object.values(配方配置).filter(r => 
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
  return Object.values(建筑配置)
      .filter(b => b.类型 === 类型)
      .map(b => b.id);
};

// --- 3. 核心动作：数值加减 ---
const 调整建筑分配数量 = (配方id, 建筑id, delta) => {
    const 调整值 = delta * 倍率.value

    if (调整值 > 0 ){
        //判定库存够不够,如果真则减去
        if( (游戏数据.库存[建筑id] || 0) < 调整值) return;
            游戏数据.库存[建筑id] = 游戏数据.库存[建筑id] - 调整值

            //初始化数据,并增加
            if(!游戏数据.配方分配[配方id]) 游戏数据.配方分配[配方id] = {}
            if(!游戏数据.配方分配[配方id][建筑id]) 游戏数据.配方分配[配方id][建筑id] = {数量:0,状态:'运行'}
            游戏数据.配方分配[配方id][建筑id].数量 = 游戏数据.配方分配[配方id][建筑id].数量 + 调整值
    }

    else{
        if ((游戏数据.配方分配[配方id][建筑id].数量 || 0) < -调整值) return;
        游戏数据.配方分配[配方id][建筑id].数量 -= -调整值

        //如果数值为0,删除掉
        if (游戏数据.配方分配[配方id][建筑id].数量 === 0) {
            delete 游戏数据.配方分配[配方id][建筑id];
        }

        if (!游戏数据.库存[建筑id]) 游戏数据.库存[建筑id] = 0;
        游戏数据.库存[建筑id] += -调整值
    }
  };

  const 格式化配方物品 = (list) => {
    if (!list || list.length === 0) return '无';
  
    return list.map(item => {
        // 去物品配置里查名字，查不到就显示 ID 兜底
        const 名称 = 物品配置[item.id]?.名称 || item.id;
        return `${名称}x${item.数量}`;
    }).join(', '); // 最后用逗号把它们连成一个字符串
  };

</script>