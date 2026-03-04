<script setup>
import { onMounted, watch, ref, computed, h, provide } from 'vue';

import { wu_pin_lan, wu_pin_xiang_qing } from '@/features/wu_pin_xi_tong/index.js';
import Ding_bu from './components/kuang_jia/ding_bu.vue';
import { ke_ji_lan, ke_ji_xiang_qing } from './features/ke_ji_xi_tong/index.js';
import { Ji_suan_ji_mian_ban } from '@/features/ji_suan_ji_xi_tong';
import { she_zhi_mian_ban } from '@/features/she_zhi_xi_tong/index.js'
import { ben_di_gang_kou, quan_ju_wu_liu_gai_lan } from '@/features/wu_liu_xi_tong/index.js';

import { darkTheme, useOsTheme } from 'naive-ui';
import { use游戏设置 } from '@/features/she_zhi_xi_tong/index.js';
import { 全局常量 } from '@/shared/constants';

import { 启动游戏循环 } from './core/dong_tai_shu_ju.js';
import { 启动自动存档, 读档 } from './core/cun_du_dang';
import { use游戏控制 } from '@/features/you_xi_kong_zhi/store.js';
const 游戏设置 = use游戏设置();

const 游戏控制 = use游戏控制()

const osTheme = useOsTheme(); // 监听系统主题
// 选择的物品
const dq_xuan_ze_id = ref(null);
const dq_line_id = ref(全局常量.默认产线ID);


const handleAction = (payload) => {
  if (typeof payload === 'object' && payload !== null && payload.itemId) {
    // 方式 A：来自我们新改造的生产线面板或总览
    dq_xuan_ze_id.value = payload.itemId;
    // 无论是具体的 line_xxx 还是 overview，都原封不动传下去
    dq_line_id.value = payload.lineId;
  } else {
    // 方式 B：来自超链接纯文本 (点击图标等)
    dq_xuan_ze_id.value = payload;
    dq_line_id.value = 'overview'; // 超链接点击也当成只读预览
  }

  当前标签页.value = 'wupin'; // 强制把左侧菜单切回物品页
};
provide('全局跳转物品', handleAction);

const dq_ke_ji_id = ref(null);
const handleKeJiAction = (id) => {
  dq_ke_ji_id.value = id;
  当前标签页.value = 'keji'; // 自动切到科技页
};
provide('全局跳转科技', handleKeJiAction);

const 当前主题 = computed(() => {
  const mode = 游戏设置.显示配置.主题模式;
  if (mode === 'auto') {
    return osTheme.value === 'dark' ? darkTheme : null;
  }
  return mode === 'dark' ? darkTheme : null;
});


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
  { label: '科技', key: 'keji' },
  { label: '港口', key: 'gangkou' },
  { label: '设置', key: 'shezhi' },
];

</script>

<template>
  <n-config-provider :theme="当前主题">
    <n-dialog-provider>
      <n-message-provider>

        <n-layout style="height: 100vh">

          <n-layout-header bordered
            style="height: 64px; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; ">

            <ding_bu />

          </n-layout-header>


          <n-layout has-sider position="absolute" style="top: 64px; bottom: 0;">

            <n-layout-sider bordered width="160" content-style="padding-top: 16px;">
              <n-menu v-model:value="当前标签页" :options="menuOptions" />
            </n-layout-sider>

            <n-layout-content style=" padding: 24px;">

              <div v-if="当前标签页 === 'wupin'">
                <h2 style="margin-bottom: 16px;">生产概览</h2>
                <wu_pin_lan @发送物品id="handleAction" />
              </div>

              <div v-if="当前标签页 === 'keji'">
                <h2 style="margin-bottom: 16px;">科技研发</h2>
                <ke_ji_lan @发送科技id="handleKeJiAction" />
              </div>

              <div v-if="当前标签页 === 'gangkou'" style="height: 100%;">
                <h2 style="margin-bottom: 16px;">运输港口</h2>
                <ben_di_gang_kou />
              </div>

              <div v-if="当前标签页 === 'shezhi'" style="height: 100%;">
                <h2 style="margin-bottom: 16px;">系统设置</h2>
                <she_zhi_mian_ban />
              </div>

            </n-layout-content>

            <n-layout-sider width="320" collapse-mode="width" :collapsed-width="0" show-trigger="arrow-circle" bordered
              content-style="padding: 24px;">

              <wu_pin_xiang_qing v-if="当前标签页 === 'wupin'" :id="dq_xuan_ze_id" :lineId="dq_line_id" />

              <ke_ji_xiang_qing v-show="当前标签页 === 'keji'" :id="dq_ke_ji_id" @切换科技="handleKeJiAction" />

            </n-layout-sider>

          </n-layout>

        </n-layout>

        <n-drawer v-model:show="游戏控制.计算面板显示" :width="800" placement="right" display-directive="show">
          <n-drawer-content title="💻 殖民地计算中心" closable>

            <Ji_suan_ji_mian_ban />

          </n-drawer-content>
        </n-drawer>

        <n-drawer v-model:show="游戏控制.航线面板显示" :width="1200" placement="right" display-directive="show">
          <n-drawer-content title="🚀 帝国航线调度中心" closable>
            <quan_ju_wu_liu_gai_lan />
          </n-drawer-content>
        </n-drawer>

      </n-message-provider>
    </n-dialog-provider>
  </n-config-provider>
</template>
