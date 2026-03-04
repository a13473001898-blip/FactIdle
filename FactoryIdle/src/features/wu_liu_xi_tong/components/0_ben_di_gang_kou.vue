<template>
    <div class="port-container">

        <n-card size="small" style="margin-bottom: 16px; border-radius: 8px;">
            <template #header>
                <n-text strong>📡 港口吞吐枢纽</n-text>
            </template>
            <template #header-extra>
                <n-checkbox v-model:checked="仅显示作业中" size="small">
                    <span>隐藏排队中飞船</span>
                </n-checkbox>
            </template>

            <n-grid :cols="3" :x-gap="12"
                style="margin-bottom: 16px; background-color: rgba(0,0,0,0.02); padding: 12px; border-radius: 6px;">
                <n-grid-item>
                    <n-statistic label="港口总带宽" :value="网络性能.总带宽">
                        <template #suffix><span style="font-size: 14px;">B/s</span></template>
                    </n-statistic>
                </n-grid-item>
                <n-grid-item>
                    <n-statistic label="并发处理上限" :value="网络性能.并发上限">
                        <template #suffix><span style="font-size: 14px;">艘</span></template>
                    </n-statistic>
                </n-grid-item>
                <n-grid-item>
                    <n-statistic label="当前队列总数" :value="原始港口队列.length">
                        <template #suffix><span style="font-size: 14px;">艘</span></template>
                    </n-statistic>
                </n-grid-item>
            </n-grid>

            <n-empty v-if="显示用港口队列.length === 0" description="当前无飞船进行装卸作业" style="margin: 24px 0;" />
            
            <n-flex v-else :size="12">
                <fei_chuan_ka_pian v-for="shipId in 显示用港口队列" :key="shipId" :shipId="shipId" @click="打开改装(shipId)" />
            </n-flex>
        </n-card>

        <n-card size="small" style="flex: 1; border-radius: 8px;">
            <template #header>
                <n-text strong>⚓ 停泊区与干船坞</n-text>
            </template>

            <n-flex :size="12">
                <div class="build-ship-card" @click="处理新建飞船">
                    <div class="build-icon">➕</div>
                    <div class="build-text">建造新飞船</div>
                </div>

                <fei_chuan_ka_pian v-for="shipId in 纯停泊列表" :key="shipId" :shipId="shipId" @click="打开改装(shipId)" />
            </n-flex>
        </n-card>

        <n-drawer v-model:show="抽屉是否显示" :width="400" placement="right">
            <n-drawer-content title="🛠️ 飞船装配车间" closable>
                <Fei_chuan_zhuang_pei_chou_ti v-if="选中操作的飞船ID" :shipId="选中操作的飞船ID" @close="抽屉是否显示 = false" />
            </n-drawer-content>
        </n-drawer>

    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useThemeVars } from 'naive-ui';
import { use殖民地系统 } from '@/features/zhi_min_di_xi_tong';
import { use航线调度系统 } from '../store_hang_xian.js';
import { use飞船实体系统 } from '../store_fei_chuan.js';
import { use计算机系统 } from '@/features/ji_suan_ji_xi_tong/store.js';
import Fei_chuan_ka_pian from './2_fei_chuan_ka_pian.vue';
import Fei_chuan_zhuang_pei_chou_ti from './3_fei_chuan_zhuang_pei_chou_ti.vue';

const themeVars = useThemeVars();

// 系统实例
const 殖民地 = use殖民地系统();
const 航线库 = use航线调度系统();
const 飞船库 = use飞船实体系统();
const 计算机 = use计算机系统();

// 核心视角依赖
const cid = computed(() => 殖民地.当前视角ID);

// ---------------- 🔴 动态作业区逻辑 ----------------
const 仅显示作业中 = ref(false);
const 网络性能 = computed(() => 计算机.获取基地网络性能(cid.value));

// 原始队列（包含装卸中 + 排队中）
const 原始港口队列 = computed(() => {
    return 航线库.星系港口队列[cid.value] || [];
});

// 过滤后的队列（根据玩家复选框）
const 显示用港口队列 = computed(() => {
    if (!仅显示作业中.value) return 原始港口队列.value;

    // 如果勾选了“仅显示作业中”，则过滤掉状态为“排队中”的飞船
    return 原始港口队列.value.filter(shipId => {
        const ship = 飞船库.获取飞船(shipId);
        return ship && ship.当前状态 === '装卸中';
    });
});

// ---------------- 🔵 静态停泊区逻辑 ----------------
// 只筛选真正处于“停泊中”状态的飞船，避免和上方作业区重复显示
const 纯停泊列表 = computed(() => {
    return Object.values(飞船库.舰队库)
        .filter(ship => ship.当前位置 === cid.value && ship.当前状态 === '停泊中')
        .map(ship => ship.id);
});

// ---------------- 🟡 改装抽屉逻辑 ----------------
const 抽屉是否显示 = ref(false);
const 选中操作的飞船ID = ref(null);

const 打开改装 = (shipId) => {
    选中操作的飞船ID.value = shipId;
    抽屉是否显示.value = true;
};

const 处理新建飞船 = () => {
    // 1. 底层调用，生成一艘新飞船（初始无骨架）
    const newShipId = 飞船库._创建飞船(cid.value);
    // 2. 自动打开该飞船的改装抽屉，引导玩家插船体
    打开改装(newShipId);
};
</script>

<style scoped>
.port-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    gap: 16px;
}

/* 虚线新建按钮的样式 */
.build-ship-card {
    width: 260px;
    height: 120px;
    /* 和实体卡片高度差不多对齐 */
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    border: 2px dashed v-bind('themeVars.dividerColor');
    border-radius: 8px;
    background-color: v-bind('themeVars.actionColor');
    transition: all 0.2s;
    color: v-bind('themeVars.textColor3');
}

.build-ship-card:hover {
    border-color: v-bind('themeVars.primaryColor');
    color: v-bind('themeVars.primaryColor');
    background-color: rgba(24, 160, 88, 0.05);
    /* 微微透出主题色 */
}

.build-icon {
    font-size: 24px;
    margin-bottom: 8px;
}

.build-text {
    font-size: 14px;
    font-weight: bold;
}
</style>