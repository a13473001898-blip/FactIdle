<template>
  <div class="route-editor-container">
    <n-flex vertical :size="20">
      
      <div v-for="(node, nodeIndex) in nodes" :key="'node-' + nodeIndex" class="node-block">
        
        <div class="node-header">
           <div style="display: flex; align-items: center;">
             <span class="node-index">{{ nodeIndex + 1 }}</span>
             <span style="font-weight:bold; font-size: 15px; margin-right: 16px;">目标星系</span>
           </div>
           
           <n-select 
              v-model:value="node.节点星系CID" 
              :options="星系选项" 
              placeholder="请选择停靠星系..." 
              style="width: 220px;" 
           />
           
           <n-select 
              v-model:value="node.停靠规则" 
              :options="停靠规则选项" 
              style="width: 180px; margin-left: 12px;" 
           />
           
           <div style="flex: 1;"></div>
           
           <n-button type="error" quaternary @click="移除节点(nodeIndex)">
             ✖ 移除该节点
           </n-button>
        </div>

        <div class="node-body">
          <n-empty v-if="node.操作列表.length === 0" description="到达该星系后不执行装卸，直接离开" style="margin: 16px 0;" />
          
          <n-flex vertical :size="12" v-else style="margin-bottom: 16px;">
             <div v-for="(action, actionIndex) in node.操作列表" :key="'action-' + actionIndex" class="action-item">
                
                <n-radio-group v-model:value="action.动作" size="small" style="flex-shrink: 0;">
                  <n-radio-button value="装载">➕ 装载</n-radio-button>
                  <n-radio-button value="卸载">➖ 卸载</n-radio-button>
                </n-radio-group>
                
                <n-select 
                  v-model:value="action.物品id" 
                  :options="可用物资选项" 
                  filterable 
                  placeholder="请指定要搬运的物资..." 
                  style="width: 240px;" 
                />
                
                <n-input-number 
                  :value="typeof action.目标数量 === 'number' ? action.目标数量 : 0" 
                  @update:value="val => action.目标数量 = val"
                  :min="1" :step="100" 
                  :disabled="action.目标数量 === '全部'" 
                  style="width: 160px;" 
                >
                  <template #suffix>个</template>
                </n-input-number>
                
                <n-checkbox 
                  :checked="action.目标数量 === '全部'" 
                  @update:checked="val => action.目标数量 = val ? '全部' : 100"
                >
                  装满/清空
                </n-checkbox>
                
                <div style="flex: 1;"></div>
                
                <n-button type="error" ghost circle size="small" @click="移除动作(nodeIndex, actionIndex)">
                  ✖
                </n-button>
             </div>
          </n-flex>
          
          <n-button dashed block type="primary" @click="追加动作(nodeIndex)">
            ➕ 添加一项装卸动作
          </n-button>
        </div>
      </div>
      
      <n-button dashed block type="info" style="height: 50px; font-size: 15px; font-weight: bold;" @click="追加节点">
        📍 追加下一个航线节点
      </n-button>
      
    </n-flex>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { use殖民地系统 } from '@/features/zhi_min_di_xi_tong';
import { 获取所有物品列表 } from '@/shared/pei_zhi_shu_ju.js';

// 接收外部的草稿数据并建立双向绑定
const props = defineProps({
  modelValue: { type: Array, required: true }
});
const emit = defineEmits(['update:modelValue']);

const nodes = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const 殖民地系统 = use殖民地系统();

const 星系选项 = computed(() => {
  return 殖民地系统.列表.map(c => ({ label: c.名称, value: c.id }));
});

const 停靠规则选项 = [
  { label: '按次序执行即走', value: '按次序执行即走' },
  { label: '等待条件满足 (死等)', value: '等待装满' }
];

// 🌟 修复：严谨遍历所有物品，排除不可被搬运的虚拟/建筑资产
const 可用物资选项 = computed(() => {
  const list = 获取所有物品列表();
  if (!list) return [];
  const options = [];
  for (const key in list) {
      const item = list[key];
      if (item.类型 !== '建筑' && item.类型 !== '计算机硬件' && item.类型 !== '飞船模块' && item.类型 !== '科技包') {
          options.push({ label: item.名称, value: item.id });
      }
  }
  return options;
});

// ========== 增删操作 ==========
const 追加节点 = () => {
  const newNodes = JSON.parse(JSON.stringify(nodes.value));
  newNodes.push({
    节点星系CID: null,
    停靠规则: '按次序执行即走',
    操作列表: []
  });
  nodes.value = newNodes;
};

const 移除节点 = (index) => {
  const newNodes = JSON.parse(JSON.stringify(nodes.value));
  newNodes.splice(index, 1);
  nodes.value = newNodes;
};

const 追加动作 = (nodeIndex) => {
  const newNodes = JSON.parse(JSON.stringify(nodes.value));
  newNodes[nodeIndex].操作列表.push({
    动作: '装载',
    物品id: null,
    目标数量: '全部'
  });
  nodes.value = newNodes;
};

const 移除动作 = (nodeIndex, actionIndex) => {
  const newNodes = JSON.parse(JSON.stringify(nodes.value));
  newNodes[nodeIndex].操作列表.splice(actionIndex, 1);
  nodes.value = newNodes;
};
</script>

<style scoped>
.route-editor-container {
  padding: 8px 0 32px 0;
}
.node-block {
  background: var(--n-color-modal);
  border: 1px solid var(--n-border-color);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}
.node-header {
  background: rgba(24, 160, 88, 0.1); /* 浅色醒目背景 */
  border-bottom: 1px solid var(--n-border-color);
  padding: 12px 16px;
  display: flex;
  align-items: center;
}
.node-index {
  background: var(--n-primary-color);
  color: white;
  width: 26px;
  height: 26px;
  border-radius: 13px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}
.node-body {
  padding: 16px;
}
.action-item {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--n-color);
  padding: 12px 16px;
  border: 1px solid var(--n-border-color);
  border-radius: 6px;
}
</style>