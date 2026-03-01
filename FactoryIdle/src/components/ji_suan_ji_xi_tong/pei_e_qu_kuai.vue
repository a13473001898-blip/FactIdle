<template>
    <div>
        <div v-if="计算机.分类总容量[category] === 0" style="padding: 16px 0; text-align: center;">
            <n-text depth="3">未挂载该类型的硬盘，无法分配存储空间</n-text>
        </div>

        <div v-else>
            <n-flex justify="space-between" align="center" style="margin-bottom: 6px;">
                <n-text depth="3" style="font-size: 12px; font-family: monospace;">
                    剩余: <span class="remaining-text">{{ 格式化字节(池数据.剩余) }}</span> / {{ 格式化字节(池数据.总量) }}
                </n-text>
            </n-flex>
            <n-progress type="line" :percentage="池数据.总量 > 0 ? (池数据.已用 / 池数据.总量) * 100 : 0" :show-indicator="false"
                :status="(池数据.已用 / 池数据.总量) > 0.95 ? 'error' : ((池数据.已用 / 池数据.总量) > 0.75 ? 'warning' : 'success')"
                style="height: 8px;" />

            <n-divider style="margin: 16px 0;" />

            <div v-for="(分配量, 物品id) in 当前分类配额表" :key="物品id" class="quota-item">

                <n-flex justify="space-between" align="center" style="margin-bottom: 4px;">
                    <div style="font-weight: bold;">
                        <wu_pin_chao_lian_jie :id="物品id" />
                    </div>

                    <n-flex align="center" :size="8" :wrap="false">
                        <n-text depth="3" style="font-size: 12px;">
                            单体: {{ 获取物品数据(物品id)?.字节 || 1 }} B
                        </n-text>
                        <n-button size="tiny" type="error" quaternary @click="触发配额更新(物品id, 0)"
                            style="padding: 0 4px; height: 20px; font-size: 12px;">
                            ✖ 移除
                        </n-button>
                    </n-flex>
                </n-flex>

                <n-flex align="center" :wrap="false">
                    <n-input-number :value="分配量" :min="0" :step="100" size="small" style="flex: 1;"
                        @update:value="(val) => 触发配额更新(物品id, val)" />
                    <n-text depth="3" style="font-size: 12px; margin-left: 8px; width: 85px; text-align: right;">
                        约 {{ 格式化字节(分配量 * (获取物品数据(物品id)?.字节 || 1)) }}
                    </n-text>
                </n-flex>
            </div>

            <n-flex align="center">
                <n-select v-model:value="新增配额物品" :options="当前分类可用选项" filterable :placeholder="'新增' + category + '配额...'"
                    style="flex:1" size="small" />
                <n-button size="small" type="primary" @click="执行新增配额" :disabled="!新增配额物品">添加</n-button>
            </n-flex>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useMessage, useThemeVars } from 'naive-ui'; //
import { use计算机系统 } from '@/stores/ji_suan_ji_xi_tong.js';
import { 获取物品数据, 获取所有物品列表, 获取物品存储类别 } from '@/pei_zhi_shu_ju.js';
import { 格式化字节 } from '@/gong_ju';

const themeVars = useThemeVars(); //
const props = defineProps({
    category: { type: String, required: true }
});

const 计算机 = use计算机系统();
const message = useMessage();
const 所有物品数组 = Object.values(获取所有物品列表());

const 池数据 = computed(() => 计算机.公共池状态[props.category]);

const 当前分类配额表 = computed(() => {
    const result = {};
    for (const [id, 分配量] of Object.entries(计算机.保底配额表)) {
        if (获取物品存储类别(id) === props.category) {
            result[id] = 分配量;
        }
    }
    return result;
});

const 当前分类可用选项 = computed(() => {
    return 所有物品数组.filter(item => {
        if (['科技包', '计算机硬件'].includes(item.类型)) return false;
        if (获取物品存储类别(item.id) !== props.category) return false;
        return true;
    }).map(item => ({ label: item.名称, value: item.id }));
});

const 新增配额物品 = ref(null);

const 执行新增配额 = () => {
    if (新增配额物品.value && 计算机.保底配额表[新增配额物品.value] === undefined) {
        const 成功 = 计算机.设置保底配额(新增配额物品.value, 100);
        if (!成功) {
            message.warning("硬盘总容量不足，无法新增保底配额！");
        } else {
            新增配额物品.value = null;
        }
    }
};

const 触发配额更新 = (物品id, val) => {
    if (val === null) val = 0;
    const 成功 = 计算机.设置保底配额(物品id, val);
    if (!成功) {
        message.error("硬盘总容量不足，分配失败！");
    }
};
</script>

<style scoped>
.remaining-text {
    /* 使用 Naive UI 的成功色替换硬编码绿色 */
    color: v-bind('themeVars.successColor'); 
    font-weight: bold;
}

.quota-item {
    margin-bottom: 12px;
    padding-bottom: 8px;
    /* 使用动态分割线颜色 */
    border-bottom: 1px dashed v-bind('themeVars.dividerColor'); 
}
</style>