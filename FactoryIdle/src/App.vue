<script setup>
import { onMounted,onUnmounted,ref,watch } from 'vue';

import wu_pin_ka_pian from './components/wu_pin_ka_pian.vue';
import Xiang_qing_lan from './components/xiang_qing_lan/index.vue';

import { 物品 as 物品配置, 配方 as 配方配置, 建筑 as 建筑配置 } from './pei_zhi_shu_ju.js';
import { 更新全局速率, 游戏数据 } from './dong_tai_shu_ju.js';


//选择的物品
const dq_xuan_ze_id = ref(null);

const handleAction = (id) => {
  console.log('选中了:', id);
  dq_xuan_ze_id.value = id; // 更新选中的ID，右侧详情栏会自动刷新
};

watch(
  () => 游戏数据.配方分配,
  更新全局速率,
  {deep : true,immediate : true}
)

</script>

<template>
  <n-config-provider>
    <n-layout has-sider style="position: absolute; top: 0; bottom: 0; left: 0; right: 0;">
      <n-layout-content style="background-color: #f0f2f5; padding: 24px;">
        <h2 style="margin-bottom: 16px;">资源概览</h2>
        <n-flex>
          <wu_pin_ka_pian
            v-for="(属性值,属性名) in 物品配置"
            :key="属性值.id"
            :id="属性值.id"
            class="物品卡片"
            :名称="属性值.名称"
            :数量="游戏数据.库存[属性值.id]"
            :速率="游戏数据.速率[属性值.id]?.净值 || 0"
            @action="handleAction"
            />
        </n-flex>
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
/* 当卡片被点击时，稍微缩小一点点，模拟按压效果 */
.物品卡片:active {
  transform: scale(0.95);
  transition: transform 0.1s;
}
</style>
