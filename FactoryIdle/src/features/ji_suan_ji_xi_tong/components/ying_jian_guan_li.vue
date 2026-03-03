<template>
    <n-card size="small" title="🖥️ 物理机箱组件" style="flex: 1; border-radius: 8px; overflow-y: auto;">

        <n-divider dashed style="margin: 24px 0 12px 0;">
            <n-text depth="3" style="font-size: 12px;">危险操作区</n-text>
        </n-divider>

        <n-popconfirm @positive-click="强制全员卸载(殖民地系统.当前视角ID)">
            <template #trigger>
                <n-button block type="error" ghost size="small">
                    ⚠️ 强制清空所有插槽
                </n-button>
            </template>
            确定要拆解整机吗？这会忽略容量安全校验强行拔出所有硬件。
            拔出后硬盘和内存容量将降为 0，且游戏会自动暂停。
        </n-popconfirm>

        <div class="slot-group">
            <n-text depth="3" class="slot-title">主板插槽</n-text>
            <div v-if="计算机._当前机箱.装备的主板" class="hardware-item">
                <wu_pin_chao_lian_jie :id="计算机._当前机箱.装备的主板" />
                <n-tag size="small" type="primary" :bordered="false">{{ 计算机.当前平台() }}</n-tag>
                <n-button size="tiny" type="error" ghost @click="执行卸载主板">拔出</n-button>
            </div>
            <div v-else class="hardware-empty">
                <n-select v-model:value="待装主板" :options="可用主板选项" placeholder="选择库存主板..." size="small"
                    style="flex: 1;" />
                <n-button size="small" type="primary" @click="执行安装主板" :disabled="!待装主板">安装</n-button>
            </div>
        </div>

        <n-divider style="margin: 16px 0;" />

        <div class="slot-group" :style="{ opacity: 计算机._当前机箱.装备的主板 ? 1 : 0.4 }">
        <n-text depth="3" class="slot-title">
            CPU插槽 - {{ 计算机._当前机箱.装备的CPU.length }} / {{ 计算机.槽位限制().CPU }}
        </n-text>
        <div v-for="(id, index) in 计算机._当前机箱.装备的CPU" :key="'cpu-' + index" class="hardware-item">
            <wu_pin_chao_lian_jie :id="id" />
            <n-tag size="small" type="success" :bordered="false">{{ 获取物品数据(id)?.频率 }}Hz</n-tag>
            <n-button size="tiny" type="error" ghost @click="尝试卸载CPU(index, 殖民地系统.当前视角ID)">拔出</n-button>
        </div>
        <div v-for="i in Math.max(0, 计算机.槽位限制().CPU - 计算机._当前机箱.装备的CPU.length)" :key="'empty-cpu-' + i"
            class="hardware-empty">
            <n-select :value="null" :options="可用CPU选项" placeholder="空槽位 - 点击插上CPU..." size="small"
                @update:value="(val) => 尝试安装CPU(val, 殖民地系统.当前视角ID)" />
        </div>
        </div>

        <n-divider style="margin: 16px 0;" />

        <div class="slot-group" :style="{ opacity: 计算机._当前机箱.装备的主板 ? 1 : 0.4 }">
            <n-text depth="3" class="slot-title">
                内存插槽 - {{ 计算机._当前机箱.装备的内存.length }} / {{ 计算机.槽位限制().内存 }}
            </n-text>
            <div v-for="(id, index) in 计算机._当前机箱.装备的内存" :key="'mem-' + index" class="hardware-item">
                <wu_pin_chao_lian_jie :id="id" />
                <n-tag size="small" type="info" :bordered="false">+{{ 格式化字节(获取物品数据(id)?.提供内存) }}</n-tag>
                <n-button size="tiny" type="error" ghost @click="尝试卸载内存(index, 殖民地系统.当前视角ID)">拔出</n-button>
            </div>
            <div v-for="i in 剩余内存槽位" :key="'empty-mem-' + i" class="hardware-empty">
                <n-select :value="null" :options="可用内存选项" placeholder="空槽位 - 点击插上内存..." size="small"
                    @update:value="(val) => 尝试安装内存(val, 殖民地系统.当前视角ID)" />
            </div>
        </div>

        <n-divider style="margin: 16px 0;" />

        <div class="slot-group" :style="{ opacity: 计算机._当前机箱.装备的主板 ? 1 : 0.4 }">
            <n-text depth="3" class="slot-title">
                硬盘插槽 - {{ 计算机._当前机箱.装备的硬盘.length }} / {{ 计算机.槽位限制().硬盘 }}
            </n-text>
            <div v-for="(id, index) in 计算机._当前机箱.装备的硬盘" :key="'hdd-' + index" class="hardware-item">
                <wu_pin_chao_lian_jie :id="id" />
                <n-tag size="small" type="warning" :bordered="false">
                    {{ 格式化字节(获取物品数据(id)?.提供容量) }} | {{ 获取物品数据(id)?.存储类别 || '物体' }}
                </n-tag>
                <n-button size="tiny" type="error" ghost @click="尝试卸载硬盘(index, 殖民地系统.当前视角ID)">拔出</n-button>
            </div>
            <div v-for="i in 剩余硬盘槽位" :key="'empty-hdd-' + i" class="hardware-empty">
                <n-select :value="null" :options="可用硬盘选项" placeholder="空槽位 - 点击插上硬盘..." size="small"
                    @update:value="(val) => 尝试安装硬盘(val, 殖民地系统.当前视角ID)" />
            </div>
        </div>
    </n-card>
</template>

<script setup>
import { ref, computed } from 'vue';
import { use计算机系统 } from '@/features/ji_suan_ji_xi_tong/store.js';
import { use库存 } from '@/features/wu_pin_xi_tong/index.js';
import { 获取物品数据, 获取所有物品列表 } from '@/shared/pei_zhi_shu_ju.js';
import { 格式化字节, 格式化数字 } from '@/shared/gong_ju';
import { useThemeVars } from 'naive-ui';
import { use殖民地系统 } from '@/features/zhi_min_di_xi_tong';
// 🌟 核心：引入硬件调度 Composable
import { use硬件调度 } from '@/features/ji_suan_ji_xi_tong/composables/ying_jian_diao_du.js';

const themeVars = useThemeVars();
const 殖民地系统 = use殖民地系统();
const 计算机 = use计算机系统();
const 库存 = use库存();

// 🌟 初始化调度方法
const {
    尝试安装主板, 尝试卸载主板,
    尝试安装CPU, 尝试卸载CPU,
    尝试安装内存, 尝试卸载内存,
    尝试安装硬盘, 尝试卸载硬盘,
    强制全员卸载
} = use硬件调度();

const 所有物品数组 = Object.values(获取所有物品列表());

// 选项过滤逻辑保持不变，但数值显示使用格式化工具
const 可用主板选项 = computed(() => {
    return 所有物品数组.filter(item => item.类型 === '计算机硬件' && item.CPU槽位 !== undefined && 库存.查询库存(item.id) >= 1)
        .map(item => ({ label: `${item.名称} (库存: ${格式化数字(库存.查询库存(item.id))})`, value: item.id }));
});

const 可用CPU选项 = computed(() => {
    return 所有物品数组.filter(item => item.类型 === '计算机硬件' && item.核心数 !== undefined && item.平台 === 计算机.当前平台() && 库存.查询库存(item.id) >= 1)
        .map(item => ({ label: item.名称, value: item.id }));
});

const 可用内存选项 = computed(() => {
    return 所有物品数组.filter(item => item.提供内存 > 0 && item.平台 === 计算机.当前平台() && 库存.查询库存(item.id) >= 1)
        .map(item => ({ label: `${item.名称} (+${格式化字节(item.提供内存)})`, value: item.id }));
});

const 可用硬盘选项 = computed(() => {
    return 所有物品数组.filter(item => item.提供容量 > 0 && item.平台 === 计算机.当前平台() && 库存.查询库存(item.id) >= 1)
        .map(item => ({ label: `${item.名称} (+${格式化字节(item.提供容量)})`, value: item.id }));
});

const 剩余内存槽位 = computed(() => Math.max(0, 计算机.槽位限制().内存 - 计算机._当前机箱.装备的内存.length));
const 剩余硬盘槽位 = computed(() => Math.max(0, 计算机.槽位限制().硬盘 - 计算机._当前机箱.装备的硬盘.length));

const 待装主板 = ref(null);

// 🌟 封装 UI 层操作，调用 Composable
const 执行安装主板 = () => {
    if (待装主板.value) {
        const 成功 = 尝试安装主板(待装主板.value, 殖民地系统.当前视角ID);
        if (成功) 待装主板.value = null;
    }
};

const 执行卸载主板 = () => {
    尝试卸载主板(殖民地系统.当前视角ID);
};
</script>

<style scoped>
/* 样式部分保持不变 */
.slot-group {
    margin-bottom: 8px;
}

.slot-title {
    font-size: 13px;
    margin-bottom: 8px;
    display: block;
}

.hardware-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    background-color: rgba(24, 160, 88, 0.15);
    border: 1px solid v-bind('themeVars.successColor');
    border-radius: 6px;
    margin-bottom: 8px;
    transition: all 0.2s;
}

.hardware-empty {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background-color: v-bind('themeVars.actionColor');
    border: 1px dashed v-bind('themeVars.borderColor');
    border-radius: 6px;
    margin-bottom: 8px;
    gap: 12px;
}
</style>