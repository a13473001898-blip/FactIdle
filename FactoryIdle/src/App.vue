<script setup>
import { onMounted, watch, ref, computed, h, provide } from 'vue';

import Wu_pin_lan from './components/wu_pin_xi_tong/wu_pin_lan.vue';
import Wu_pin_xiang_qing from './components/wu_pin_xi_tong/wu_pin_xiang_qing.vue';
import Ding_bu from './components/kuang_jia/ding_bu.vue';
import Ke_ji_lan from './components/ke_ji_xi_tong/ke_ji_lan.vue';
import Ke_ji_xiang_qing from './components/ke_ji_xi_tong/ke_ji_xiang_qing.vue';

import { 科技配置, 获取科技数据, 获取物品数据 } from './pei_zhi_shu_ju.js';
import { 启动游戏循环 } from './dong_tai_shu_ju.js';
import { 启动自动存档, 读档 } from './cun_du_dang';
import { use科技系统, } from './stores/ke_ji_xi_tong.js';
import { 格式化数字 } from './gong_ju.js';
import { use能源模块 } from '@/stores/neng_yuan_xi_tong.js'
import { use配方分配 } from '@/stores/pei_fang_fen_pei.js';
import { use全局速率 } from '@/stores/su_lv.js'



const 配方分配 = use配方分配();
const 能源模块 = use能源模块()
const 科技系统 = use科技系统()
const 全局速率 = use全局速率()

// 选择的物品
const dq_xuan_ze_id = ref(null);

const handleAction = (id) => {
  dq_xuan_ze_id.value = id;
  当前标签页.value = 'wupin'; // 强制把左侧菜单切回物品页
};
provide('全局跳转物品', handleAction);

const dq_ke_ji_id = ref(null);
const handleKeJiAction = (id) => {
  dq_ke_ji_id.value = id;
  当前标签页.value = 'keji'; // 自动切到科技页
};
provide('全局跳转科技', handleKeJiAction);




watch(
  () => 配方分配.数据,
  全局速率.更新全局速率,
  { deep: true, immediate: true }
)

onMounted(() => {
  读档()
  启动自动存档()
  启动游戏循环();
});

// ================= UI 控制与计算 =================

// 侧边栏菜单选项
const 当前标签页 = ref('wupin');
const menuOptions = [
  { label: '物品', key: 'wupin' },
  { label: '科技树', key: 'keji' }
];

</script>

<template>
  <n-config-provider>

    <n-layout style="height: 100vh">

      <n-layout-header bordered
        style="height: 64px; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; background-color: #fafafc;">

        <ding_bu />

      </n-layout-header>


      <n-layout has-sider position="absolute" style="top: 64px; bottom: 0;">

        <n-layout-sider bordered width="160" content-style="padding-top: 16px;">
          <n-menu v-model:value="当前标签页" :options="menuOptions" />
        </n-layout-sider>

        <n-layout-content style="background-color: #f0f2f5; padding: 24px;">

          <div v-if="当前标签页 === 'wupin'">
            <h2 style="margin-bottom: 16px;">物品概览</h2>
            <wu_pin_lan @发送物品id="handleAction" />
          </div>

          <div v-if="当前标签页 === 'keji'">
            <h2 style="margin-bottom: 16px;">科技研发</h2>
            <ke_ji_lan @发送科技id="handleKeJiAction" />
          </div>

          <div v-if="当前标签页 === 'keji'">
          </div>

        </n-layout-content>

        <n-layout-sider width="320" collapse-mode="width" :collapsed-width="0" show-trigger="arrow-circle" bordered
          content-style="padding: 24px;">

          <wu_pin_xiang_qing v-if="当前标签页 === 'wupin'" :id="dq_xuan_ze_id" />
          <ke_ji_xiang_qing v-show="当前标签页 === 'keji'" :id="dq_ke_ji_id" @切换科技="handleKeJiAction" />
        
        </n-layout-sider>

      </n-layout>

    </n-layout>
  </n-config-provider>
</template>
