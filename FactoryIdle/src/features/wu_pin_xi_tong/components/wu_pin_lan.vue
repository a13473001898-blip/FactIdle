<template>
    <div style="height: 100%; display: flex; flex-direction: column;">
        
        <n-tabs 
            v-model:value="当前激活的Tab" 
            type="card" 
            addable 
            @add="处理新建产线" 
            @close="处理关闭产线"
            style="flex: 1;"
        >
            <n-tab-pane name="overview" tab="📦 基地总览" :closable="false">
                <div style="padding-top: 16px;">
                    <n-empty v-if="分组后的物品列表.length === 0" description="仓库空空如也" style="margin-top: 40px;" />

                    <n-collapse v-else :default-expanded-names="展开的面板">
                        <n-collapse-item v-for="组 in 分组后的物品列表" :key="组.标题" :title="`${组.标题} (${组.列表.length})`" :name="组.标题">
                            <n-flex>
                                <wu_pin_ka_pian 
                                    v-for="物品 in 组.列表" 
                                    :key="物品.id" 
                                    :id="物品.id" 
                                    class="物品卡片"
                                    @action="点击物品卡片(物品.id, 'overview')" 
                                />
                            </n-flex>
                        </n-collapse-item>
                    </n-collapse>
                </div>
            </n-tab-pane>

            <n-tab-pane 
                v-for="line in 当前殖民地生产线列表" 
                :key="line.id" 
                :name="line.id" 
                :tab="'⚙️ ' + line.名称"
            >
                <sheng_chan_xian_mian_ban 
                    :lineId="line.id" 
                    @发送物品id="(id) => 点击物品卡片(id, line.id)" 
                />
            </n-tab-pane>

        </n-tabs>
    </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useDialog, useMessage, useThemeVars } from 'naive-ui';
import Wu_pin_ka_pian from './wu_pin_ka_pian.vue';
// 引入即将要在下一步编写的新组件（先占个位）
import Sheng_chan_xian_mian_ban from './sheng_chan_xian_mian_ban.vue'; 

import { 物品类型, 获取所有物品列表 } from '@/shared/pei_zhi_shu_ju';
import { use殖民地系统 } from '@/features/zhi_min_di_xi_tong';
import { use生产线系统, use生产线管理 } from '@/features/sheng_chan_xi_tong';

const themeVars = useThemeVars();
const dialog = useDialog();
const message = useMessage();

// 系统实例
const 殖民地系统 = use殖民地系统();
const 生产线系统 = use生产线系统();
const { 创建生产线, 删除生产线 } = use生产线管理();

// 抛出事件时，现在需要带上 lineId 了，方便右侧面板知道当前是在哪条线上操作
const emit = defineEmits(['发送物品id']);

const 当前激活的Tab = ref('overview');

// 生产线列表数据源
const 当前殖民地生产线列表 = computed(() => {
    const cid = 殖民地系统.当前视角ID;
    return 生产线系统.数据[cid] || [];
});

const 点击物品卡片 = (id, lineId) => {
    emit('发送物品id', { itemId: id, lineId: lineId });
};

// ================= 产线生命周期管理 =================
const 处理新建产线 = () => {
    // 你的 composable 里已经写好了校验逻辑（算力、核心上限等），直接调用
    const newLineId = 创建生产线('新生产线');
    if (newLineId) {
        // 创建成功后，自动跳转到新创建的标签页
        当前激活的Tab.value = newLineId;
    }
};

const 处理关闭产线 = (lineId) => {
    dialog.warning({
        title: '拆除生产线',
        content: '确定要拆除这条生产线吗？线上的机器将全部退回库存。',
        positiveText: '确认拆除',
        negativeText: '手滑了',
        onPositiveClick: () => {
            const success = 删除生产线(lineId);
            if (success) {
                // 如果删除的是当前正激活的 tab，退回总览
                if (当前激活的Tab.value === lineId) {
                    当前激活的Tab.value = 'overview';
                }
            }
        }
    });
};


// ================= 基地总览数据逻辑 (精简版) =================
const 分类名称列表 = Object.values(物品类型);
const 物品数组 = Object.values(获取所有物品列表());

const 分组后的物品列表 = computed(() => {
    const 结果 = 分类名称列表.map((当前分类) => {
        const 物品组 = 物品数组.filter((物品) => 物品.类型 === 当前分类);
        return { 标题: 当前分类, 列表: 物品组 };
    }).filter(组 => 组.列表.length > 0);
    
    return 结果;
});

const 展开的面板 = computed(() => 分组后的物品列表.value.map(组 => 组.标题));
</script>

<style scoped>
:deep(.n-tabs-nav) {
    /* 配合暗黑主题，稍微修饰一下 tab 导航 */
    background-color: transparent !important;
}
.物品卡片:active {
    transform: scale(0.95);
    transition: transform 0.1s;
}
</style>