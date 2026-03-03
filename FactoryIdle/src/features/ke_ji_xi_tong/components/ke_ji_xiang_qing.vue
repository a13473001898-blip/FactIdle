<template>
  <div style="height: 100%; display: flex; flex-direction: column; gap: 16px;">

    <n-empty v-if="!id" description="请选择一个科技" style="margin-top: 100px;" />

    <div v-else style="overflow-y: auto; padding-right: 8px;">

      <n-card bordered content-style="padding: 16px;">
        
        <n-flex justify="space-between" align="center" style="margin-bottom: 20px;">
          <span style="font-size: 18px; font-weight: bold;">{{ 科技?.名称 }}</span>
          <n-tag size="small" type="warning" :bordered="false" style="font-weight: bold;">
            ⏳ {{ 科技?.耗时 }}s
          </n-tag>
        </n-flex>

        <div style="margin-bottom: 24px;">
          
          <n-button v-if="可以研究 && 不是当前正在研究" type="primary" block size="large" @click="科技系统.切换当前研发科技(id)">
            🚀 开始研究
          </n-button>
          
          <n-button v-else-if="不是当前正在研究 && !已研究" disabled block size="large">
            🔒 前置条件未满足
          </n-button>
          
          <div v-else-if="已研究" style="background-color: rgba(24, 160, 88, 0.1); border: 1px solid #18a058; color: #18a058; border-radius: 4px; padding: 10px; text-align: center; font-weight: bold;">
            ✅ 已完成研发
          </div>

          <div v-if="是当前正在研究" style="background-color: rgba(24, 160, 88, 0.1); border: 1px solid #bae0ff; border-radius: 6px; padding: 12px;">
            <n-flex justify="space-between" align="center" style="margin-bottom: 8px;">
              <n-text style="font-size: 13px; font-weight: bold; color: #0050b3;">
                ⚙️ 研发中 {{ Math.floor((科技系统.当前研发.已完成比例 || 0) * 100) }}%
              </n-text>
              <n-button size="tiny" type="error" ghost @click="科技系统.取消当前研发()">
                取消
              </n-button>
            </n-flex>
            <n-progress type="line" :percentage="(科技系统.当前研发.已完成比例 || 0) * 100" :show-indicator="false" status="info" processing style="height: 6px;" />
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 12px;">
          
          <div style="background-color: rgba(24, 160, 88, 0.1); border-radius: 6px; padding: 12px; border: 1px solid #eef0f5;">
            <n-text depth="3" style="font-size: 12px; margin-bottom: 8px; display: block;">研究消耗</n-text>
            <n-empty v-if="!科技?.投入 || 科技.投入.length === 0" description="无消耗" style="margin: 0; padding: 0;" />
            <div v-else style="display: flex; flex-wrap: wrap; gap: 6px;">
              <n-tag size="small" type="info" bordered v-for="投入 in 科技?.投入" :key="投入.id">
                <Wu_pin_chao_lian_jie :id="投入.id" /> ×{{ 投入.数量 }}
              </n-tag>
            </div>
          </div>

          <div style="background-color: rgba(24, 160, 88, 0.1); border-radius: 6px; padding: 12px; border: 1px solid #e3f3c3;">
            <n-text style="font-size: 12px; margin-bottom: 8px; display: block; color: #5a8a15; font-weight: bold;">解锁配方</n-text>
            <n-empty v-if="!科技?.解锁配方 || 科技.解锁配方.length === 0" description="无解锁内容" style="margin: 0; padding: 0;" />
            <div v-else style="display: flex; flex-wrap: wrap; gap: 6px;">
              <Pei_fang_chao_lian_jie v-for="配方id in 科技.解锁配方" :key="配方id" :id="配方id" />
            </div>
          </div>

        </div>

      </n-card>

      <n-collapse :default-expanded-names="['科技脉络']" style="margin-top: 16px;">
        <n-collapse-item title="🔬 科技树" name="科技脉络">

          <div style="padding: 4px 0;">
            <n-text depth="3" style="font-size: 12px; margin-bottom: 8px; display: block;">前置科技</n-text>
            <n-empty v-if="前置科技列表.length === 0" description="起点科技" style="margin-bottom: 16px;" />
            <div v-else style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px;">
              <Ke_ji_chao_lian_jie v-for="前置 in 前置科技列表" :key="前置.id" :id="前置.id" />
            </div>

            <n-divider style="margin: 16px 0;" />

            <n-text depth="3" style="font-size: 12px; margin-bottom: 8px; display: block;">后续科技</n-text>
            <n-empty v-if="后续科技列表.length === 0" description="暂无后续" />
            <div v-else style="display: flex; flex-wrap: wrap; gap: 6px;">
              <Ke_ji_chao_lian_jie v-for="后续 in 后续科技列表" :key="后续.id" :id="后续.id" />
            </div>
          </div>

        </n-collapse-item>
      </n-collapse>

    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { 获取科技数据, 获取所有科技列表 } from '@/shared/pei_zhi_shu_ju.js';
import { use科技系统 } from '../store.js';
import Wu_pin_chao_lian_jie from '@/components/tong_yong/wu_pin_chao_lian_jie.vue';
import Ke_ji_chao_lian_jie from '@/components/tong_yong/ke_ji_chao_lian_jie.vue';
import Pei_fang_chao_lian_jie from '@/components/tong_yong/pei_fang_chao_lian_jie.vue';

const props = defineProps({
  id: { type: String, default: null }
});

defineEmits(['切换科技']);

const 科技系统 = use科技系统();
const 所有科技 = Object.values(获取所有科技列表());

const 科技 = computed(() => props.id ? 获取科技数据(props.id) : null);

const 已研究 = computed(() => 科技系统.已解锁科技.includes(props.id));
const 可以研究 = computed(() => 科技系统.可研发科技列表.some(t => t.id === props.id));
const 是当前正在研究 = computed(() => 科技系统.当前研发.科技ID === props.id);
const 不是当前正在研究 = computed(() => !是当前正在研究.value);

const 前置科技列表 = computed(() => {
  if (!科技.value?.前置科技) return [];
  return 科技.value.前置科技.map(tid => 获取科技数据(tid));
});

const 后续科技列表 = computed(() => {
  if (!props.id) return [];
  return 所有科技.filter(t => t.前置科技 && t.前置科技.includes(props.id));
});
</script>

<style scoped>
:deep(.n-collapse-item__header) {
  font-weight: bold;
}

:deep(.n-collapse-item__content-inner) {
  padding: 0 !important;
}
</style>