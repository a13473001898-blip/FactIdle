<template>
  <div class="ke-ji-lan-container">
    
    <n-collapse :default-expanded-names="['科研调度']">
      <n-collapse-item title="🔬 实验室" name="科研调度">
        <div class="lab-dispatch-container">
          
          <n-flex justify="space-between" align="center" style="margin-bottom: 16px;">
            <n-text depth="3" style="font-size: 13px;">操作倍率</n-text>
            <n-radio-group v-model:value="倍率" size="small">
              <n-radio-button :value="1">x1</n-radio-button>
              <n-radio-button :value="10">x10</n-radio-button>
              <n-radio-button :value="100">x100</n-radio-button>
              <n-radio-button :value="1000">x1000</n-radio-button>
            </n-radio-group>
          </n-flex>

          <n-empty v-if="可用实验室列表.length === 0" description="尚未解锁任何科研建筑" style="margin: 20px 0;" />

          <div v-else class="lab-grid">
            <div v-for="machineId in 可用实验室列表" :key="machineId" class="lab-card">
              
              <n-flex justify="space-between" align="center" style="margin-bottom: 12px;">
                <n-text strong style="font-size: 15px;">
                  <Wu_pin_chao_lian_jie :id="machineId" />
                </n-text>
                <n-tag size="small" :bordered="false" type="info">
                  空闲: {{ Math.floor(库存.查询库存(machineId)) }}
                </n-tag>
              </n-flex>

              <n-flex justify="space-between" align="center">
                <n-text depth="3" style="font-size: 13px;">投入数量</n-text>
                <n-button-group size="small">
                  <n-button @click="尝试减少分配('ke_yan', machineId, 1 * 倍率,殖民地系统.当前视角ID)" style="width: 36px; font-weight: bold;">-</n-button>
                  <div class="allocation-number-box">
                    {{ 格式化数字(配方分配.查询分配数量(全局常量.默认产线ID, 'ke_yan', machineId, 殖民地系统.当前视角ID)) }}
                  </div>
                  <n-button @click="尝试增加分配('ke_yan', machineId, 1 * 倍率,殖民地系统.当前视角ID)" style="width: 36px; font-weight: bold;">+</n-button>
                </n-button-group>
              </n-flex>

              <div v-if="配方分配.查询分配数量(全局常量.默认产线ID, 'ke_yan', machineId, 殖民地系统.当前视角ID) > 0" class="machine-status-action">
                <n-button 
                  block 
                  size="small" 
                  secondary
                  :type="配方分配.查询建筑状态(全局常量.默认产线ID, 'ke_yan', machineId, 殖民地系统.当前视角ID) === '运行' ? 'success' : 'error'"
                  @click="切换状态('ke_yan', machineId, 殖民地系统.当前视角ID, 全局常量.默认产线ID)"
                >
                  {{ 配方分配.查询建筑状态(全局常量.默认产线ID, 'ke_yan', machineId, 殖民地系统.当前视角ID) === '运行' ? '✅ 运转中 (点击停机)' : '⏸ 已停机 (点击启动)' }}
                </n-button>
              </div>

            </div>
          </div>
        </div>
      </n-collapse-item>
    </n-collapse>

    <n-card size="small" :bordered="false" class="filter-card">
      <n-radio-group v-model:value="当前筛选" size="medium">
        <n-radio-button value="已研究">已研究 ({{ 已研究列表.length }})</n-radio-button>
        <n-radio-button value="可研究">可研究 ({{ 可研究列表.length }})</n-radio-button>
        <n-radio-button value="未解锁">未解锁 ({{ 未解锁列表.length }})</n-radio-button>
      </n-radio-group>
    </n-card>

    <n-empty v-if="当前显示列表.length === 0" description="暂无符合条件的科技" style="margin-top: 40px;" />
    
    <n-grid v-else :cols="3" x-gap="16" y-gap="16">
      <n-grid-item v-for="科技 in 当前显示列表" :key="科技.id">
        <ke_ji_ka_pian 
          :id="科技.id" 
          @click="$emit('发送科技id', 科技.id)"
        />
      </n-grid-item>
    </n-grid>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import Ke_ji_ka_pian from './ke_ji_ka_pian.vue';
import { use科技系统 } from '../store.js';
import { use库存 } from '@/features/wu_pin_xi_tong';
import { use配方分配 } from '@/features/sheng_chan_xi_tong';
import { 获取所有科技列表, 获取所有建筑列表 } from '@/shared/pei_zhi_shu_ju';
import { 格式化数字 } from '@/shared/gong_ju';
import Wu_pin_chao_lian_jie from '@/components/tong_yong/wu_pin_chao_lian_jie.vue';
import { useMessage, useThemeVars } from 'naive-ui';
import { use殖民地系统 } from '@/features/zhi_min_di_xi_tong';
import { use建筑调度 } from '@/features/sheng_chan_xi_tong';

const emit = defineEmits(['发送科技id']);
const 科技系统 = use科技系统();
const 库存 = use库存();
const 配方分配 = use配方分配();
const message = useMessage();
const themeVars = useThemeVars(); // 修正：初始化变量
const 殖民地系统 = use殖民地系统();
const { 尝试增加分配, 尝试减少分配, 切换状态 } = use建筑调度();
import { 全局常量 } from '@/shared/constants';

// 筛选状态与倍率
const 当前筛选 = ref('可研究');
const 倍率 = ref(1);

const 可用实验室列表 = computed(() => {
  return Object.values(获取所有建筑列表())
    .filter(b => b.类型 === '研究')
    .map(b => b.id);
});


const 所有科技数组 = Object.values(获取所有科技列表());

const 已研究列表 = computed(() => 所有科技数组.filter(t => 科技系统.已解锁科技.includes(t.id)));
const 可研究列表 = computed(() => 科技系统.可研发科技列表);
const 未解锁列表 = computed(() => {
  return 所有科技数组.filter(t => {
    const 没解锁 = !科技系统.已解锁科技.includes(t.id);
    const 不能研究 = !科技系统.可研发科技列表.some(r => r.id === t.id);
    return 没解锁 && 不能研究;
  });
});

const 当前显示列表 = computed(() => {
  if (当前筛选.value === '已研究') return 已研究列表.value;
  if (当前筛选.value === '可研究') return 可研究列表.value;
  return 未解锁列表.value;
});
</script>

<style scoped>
.ke-ji-lan-container {
  display: flex; 
  flex-direction: column; 
  gap: 16px;
}

/* 修正：科研调度面板样式 */
.lab-dispatch-container {
  background-color: v-bind('themeVars.modalColor'); 
  padding: 16px; 
  border-radius: 8px; 
  border: 1px solid v-bind('themeVars.borderColor');
}

.lab-grid {
  display: grid; 
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); 
  gap: 16px;
}

.lab-card {
  border: 1px solid v-bind('themeVars.borderColor'); 
  border-radius: 6px; 
  padding: 12px; 
  background-color: v-bind('themeVars.cardColor'); 
  transition: all 0.2s; 
  box-shadow: 0 2px 8px rgba(0,0,0,0.02);
}

.allocation-number-box {
  width: 60px; 
  flex-shrink: 0; 
  background: v-bind('themeVars.actionColor'); 
  border-top: 1px solid v-bind('themeVars.borderColor'); 
  border-bottom: 1px solid v-bind('themeVars.borderColor'); 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  font-weight: bold; 
  font-family: monospace; 
  font-size: 14px;
}

.machine-status-action {
  margin-top: 12px; 
  padding-top: 12px; 
  border-top: 1px dashed v-bind('themeVars.dividerColor');
}

.filter-card {
  background-color: transparent !important;
}

:deep(.n-collapse-item__header) {
  font-weight: bold;
  font-size: 15px;
}
</style>