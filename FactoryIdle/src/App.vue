<script setup>
import { onMounted, watch, ref, computed, h } from 'vue';

import Xiang_qing_lan from './components/xiang_qing_lan/index.vue';
import Wu_pin_lan from './components/wu_pin_lan.vue';


import { 科技配置, 获取科技数据, 获取物品数据 } from './pei_zhi_shu_ju.js';
import { 更新全局速率, 游戏数据, 启动游戏循环 } from './dong_tai_shu_ju.js';
import { 启动自动存档, 读档 } from './cun_du_dang';
import { 切换当前研发科技 } from './ke_ji_xi_tong.js'; 
import { 格式化数字 } from './gong_ju.js';

// 选择的物品
const dq_xuan_ze_id = ref(null);

const handleAction = (id) => {
  console.log('选中了:', id);
  dq_xuan_ze_id.value = id; // 更新选中的ID，右侧详情栏会自动刷新
};

watch(
  () => 游戏数据.配方分配,
  更新全局速率,
  { deep : true, immediate : true }
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
  { label: '物品与物流', key: 'wupin' },
  { label: '科技树', key: 'keji' }
];

// 计算可研发科技列表
const 可研发科技列表 = computed(() => {
    const 已解锁 = 游戏数据.科技系统.已解锁列表 || [];
    return Object.values(科技配置).filter(科技 => {
        // 1. 已经解锁的就不显示了
        if (已解锁.includes(科技.id)) return false;
        // 2. 前置科技没解锁的不显示
        const 前置满足 = 科技.前置科技.every(前置id => 已解锁.includes(前置id));
        return 前置满足;
    });
});

const 获取能源负载百分比 = (type) => {
    const data = 游戏数据.能源系统[type];
    if (!data) return 0;

    // 如果没有任何机器需求，负载就是 0
    if (data.需求 === 0) return 0;
    
    // 如果有需求，但是发电量为 0（彻底停电/断料），直接显示 100% 并爆红
    if (data.供应 === 0) return 100;

    // 真正的逻辑：需求 / 供应上限
    const load = (data.需求 / data.供应) * 100;
    return Math.min(load, 100); // 封顶 100% 防止溢出
};

const 获取能源状态颜色 = (type) => {
  const data = 游戏数据.能源系统[type];
  if (!data) return 'success';

  // 1. 供不应求，严重警告变红
  if (data.负载率 < 1 || data.供应 === 0) return 'error'; 

  // 2. 负载超过 75%，黄灯警告
  if (data.需求 > 0 && data.供应 > 0 && (data.需求 / data.供应) > 0.75) return 'warning'; 

  // 3. 产能充足，绿色
  return 'success'; 
};
</script>

<template>
  <n-config-provider>
    <n-layout style="height: 100vh">
      
      <n-layout-header bordered style="height: 64px; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; background-color: #fafafc;">
        
        <div style="width: 300px;">
          <n-text depth="3" v-if="!游戏数据.科技系统.当前研发.科技ID">
            当前未进行研究
          </n-text>
          <div v-else>
            <n-flex justify="space-between" align="center" style="margin-bottom: 2px;">
              <n-text style="font-size: 13px; font-weight: bold;">
                研发中: {{ 获取科技数据(游戏数据.科技系统.当前研发.科技ID)?.名称 }}
              </n-text>
              <n-text style="font-size: 12px;" depth="3">
                {{ Math.floor((游戏数据.科技系统.当前研发.已完成比例 || 0) * 100) }}%
              </n-text>
            </n-flex>
            <n-progress 
              type="line" 
              :percentage="(游戏数据.科技系统.当前研发.已完成比例 || 0) * 100" 
              :show-indicator="false" 
              status="info" 
              processing 
            />
          </div>
        </div>

        <n-flex gap="24px">
          <div v-for="type in ['热能', '蒸汽', '电力']" :key="type" style="width: 140px;">
            
            <n-flex justify="space-between" align="center" style="margin-bottom: 2px;">
              <n-text style="font-size: 12px;" depth="2">{{ type }}负载</n-text>
              <n-text style="font-size: 12px; font-family: monospace;" depth="3">
                {{ 格式化数字(游戏数据.能源系统[type]?.需求 || 0) }} / {{ 格式化数字(游戏数据.能源系统[type]?.供应 || 0) }}
              </n-text>
            </n-flex>

            <n-progress 
              type="line" 
              :percentage="获取能源负载百分比(type)" 
              :show-indicator="false" 
              :status="获取能源状态颜色(type)" 
            />
          </div>
        </n-flex>

      </n-layout-header>

      <n-layout has-sider position="absolute" style="top: 64px; bottom: 0;">
        
        <n-layout-sider bordered width="160" content-style="padding-top: 16px;">
          <n-menu 
            v-model:value="当前标签页" 
            :options="menuOptions" 
          />
        </n-layout-sider>

        <n-layout-content style="background-color: #f0f2f5; padding: 24px;">
          
          <div v-if="当前标签页 === 'wupin'">
            <h2 style="margin-bottom: 16px;">物品概览</h2>
            <wu_pin_lan @发送物品id="handleAction" />
          </div>

          <div v-if="当前标签页 === 'keji'">
            <h2 style="margin-bottom: 16px;">可研发科技</h2>
            <n-empty v-if="可研发科技列表.length === 0" description="暂无可研发的科技" />
            
            <n-grid v-else :cols="3" x-gap="16" y-gap="16">
              <n-grid-item v-for="科技 in 可研发科技列表" :key="科技.id">
                <n-card :title="科技.名称" hoverable size="small">
                  <n-text depth="3" style="font-size: 13px;">耗时: {{ 科技.耗时 }} 秒</n-text>
                  
                  <div style="margin: 12px 0; min-height: 40px;">
                    <n-text depth="2" style="font-size: 12px; display: block; margin-bottom: 4px;">研究消耗：</n-text>
                    <n-tag v-for="投入 in 科技.投入" :key="投入.id" size="small" type="primary" bordered style="margin-right: 6px;">
                      {{ 获取物品数据(投入.id)?.名称 }} x {{ 投入.数量 }}
                    </n-tag>
                  </div>

                  <n-button 
                    block 
                    type="info" 
                    :secondary="游戏数据.科技系统.当前研发.科技ID !== 科技.id"
                    :disabled="游戏数据.科技系统.当前研发.科技ID === 科技.id"
                    @click="切换当前研发科技(科技.id)"
                  >
                    {{ 游戏数据.科技系统.当前研发.科技ID === 科技.id ? '正在研究中...' : '开始研究' }}
                  </n-button>
                </n-card>
              </n-grid-item>
            </n-grid>
          </div>

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

    </n-layout>
  </n-config-provider>
</template>

