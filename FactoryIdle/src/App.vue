<script setup>
import { onMounted,onUnmounted,ref,watch,computed } from 'vue';

import Xiang_qing_lan from './components/xiang_qing_lan/index.vue';
import Wu_pin_lan from './components/wu_pin_lan.vue';

import { 获取所有物品列表,物品类型} from './pei_zhi_shu_ju.js';
import { 更新全局速率, 游戏数据,启动游戏循环, 查询库存, 查询速率 } from './dong_tai_shu_ju.js';
import { 启动自动存档, 读档 } from './cun_du_dang';



//选择的物品
const dq_xuan_ze_id = ref(null);



const handleAction = (id) => {
  console.log('选中了:', id);
  dq_xuan_ze_id.value = id; // 更新选中的ID，右侧详情栏会自动刷新
};


watch(
  () => 游戏数据.配方分配,
  更新全局速率,
  {deep : true, immediate : true}
)

onMounted(() => {
  读档()
  启动自动存档()
  启动游戏循环();
});

</script>

<template>
  <n-config-provider>
    <n-layout has-sider style="position: absolute; top: 0; bottom: 0; left: 0; right: 0;">
      <n-layout-content style="background-color: #f0f2f5; padding: 24px;">
        <h2 style="margin-bottom: 16px;">物品概览</h2>
        <wu_pin_lan
        @发送物品id="handleAction">

        </wu_pin_lan>

      </n-layout-content>

      <n-layout-sider 
        width="320" 
        collapse-mode="width" 
        :collapsed-width="0"
        show-trigger="arrow-circle"
        bordered
        content-style="padding: 24px;"
      >
        <xiang_qing_lan :id="dq_xuan_ze_id" />
      </n-layout-sider>

    </n-layout>
  </n-config-provider>
</template>

<style scoped>

</style>
