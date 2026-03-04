<template>
    <n-layout has-sider
        style="height: 100%; border: 1px solid var(--n-border-color); border-radius: 8px; overflow: hidden;">

        <n-layout-sider bordered width="360" content-style="display: flex; flex-direction: column; height: 100%;">

            <div style="padding: 12px; border-bottom: 1px solid var(--n-border-color);">
                <n-flex justify="space-between" align="center" style="margin-bottom: 8px;">
                    <n-text strong style="font-size: 15px;">📜 帝国航线网络</n-text>
                    <n-button size="tiny" type="primary" ghost @click="触发新建分组">📁 新建分组</n-button>
                </n-flex>

                <n-collapse accordion>
                    <n-collapse-item v-for="组名 in 航线库.航线分组库" :key="组名" :name="组名">

                        <template #header>
                            <div v-if="编辑中的分组 === 组名" @click.stop>
                                <n-input v-model:value="临时输入值" size="small" style="width: 150px;" @blur="保存分组改名(组名)"
                                    @keyup.enter="保存分组改名(组名)" auto-focus />
                            </div>
                            <n-flex v-else align="center" style="width: 100%;">
                                <n-text strong style="font-size: 13px;">{{ 组名 }}</n-text>
                                <n-button size="tiny" quaternary circle @click.stop="进入分组改名(组名)">✏️</n-button>
                                <n-button size="tiny" quaternary @click.stop="触发新建航线(组名)" style="margin-left: auto;">➕
                                    航线</n-button>
                            </n-flex>
                        </template>

                        <n-collapse accordion @update:expanded-names="(val) => { 选中航线ID = val[0] || null }">
                            <n-collapse-item v-for="route in 获取组内航线(组名)" :key="route.id" :name="route.id"
                                class="custom-route-item">

                                <template #header>
                                    <div v-if="编辑中的航线 === route.id" @click.stop>
                                        <n-input v-model:value="临时输入值" size="small" style="width: 160px;"
                                            @blur="保存航线改名(route.id)" @keyup.enter="保存航线改名(route.id)" auto-focus />
                                    </div>
                                    <n-flex v-else align="center" style="width: 100%;">
                                        <div :class="['status-dot', route.分配的飞船.length > 0 ? 'active' : 'idle']"></div>
                                        <n-text style="font-size: 13px;">{{ route.名称 }}</n-text>
                                        <n-button size="tiny" quaternary circle
                                            @click.stop="进入航线改名(route.id)">✏️</n-button>
                                    </n-flex>
                                </template>

                                <div class="route-body">
                                    <div class="cargo-tags">
                                        <n-text depth="3" style="font-size: 12px; margin-right: 4px;">运载:</n-text>
                                        <n-tag v-for="itemId in 提取航线物资(route)" :key="itemId" size="small"
                                            :bordered="false" type="warning"
                                            style="margin-right: 4px; padding: 0 4px; height: 18px; font-size: 11px;">
                                            <wu_pin_chao_lian_jie :id="itemId" />
                                        </n-tag>
                                        <n-text v-if="提取航线物资(route).length === 0" depth="4"
                                            style="font-size: 11px;">暂无物流计划</n-text>
                                    </div>

                                    <n-divider style="margin: 6px 0;" />

                                    <n-flex vertical :size="6">
                                        <div v-for="shipId in route.分配的飞船" :key="shipId" class="assigned-ship-item">
                                            <n-flex justify="space-between" align="center" style="margin-bottom: 4px;">
                                                <n-text strong style="font-size: 12px;">🚢 {{ 获取飞船(shipId)?.名称 || '未知'
                                                    }}</n-text>
                                                <n-button size="tiny" type="error" quaternary circle
                                                    style="height: 18px; width: 18px;"
                                                    @click="踢出航线(shipId, route.id)">✖</n-button>
                                            </n-flex>

                                            <div v-if="获取飞船(shipId)">
                                                <div v-if="获取飞船(shipId).当前状态 === '航行中'">
                                                    <n-flex justify="space-between" align="center"
                                                        style="font-size: 11px; margin-bottom: 2px;">
                                                        <n-text depth="3">➡️ {{ 获取飞船(shipId).目标位置 }}</n-text>
                                                        <n-text strong type="info">ETA: {{ 计算剩余时间(shipId) }}</n-text>
                                                    </n-flex>
                                                    <n-progress type="line" :percentage="获取飞船(shipId).航行进度"
                                                        :show-indicator="false" status="info" style="height: 4px;" />
                                                </div>
                                                <div v-else>
                                                    <n-flex justify="space-between" align="center"
                                                        style="font-size: 11px;">
                                                        <n-text depth="3">📍 {{ 获取飞船(shipId).当前位置 }}</n-text>
                                                        <n-tag size="tiny"
                                                            :type="获取飞船(shipId).当前状态 === '装卸中' ? 'warning' : 'success'"
                                                            :bordered="false" style="height: 16px; padding: 0 4px;">
                                                            {{ 获取飞船(shipId).当前状态 }}
                                                        </n-tag>
                                                    </n-flex>
                                                </div>
                                            </div>
                                        </div>
                                    </n-flex>

                                    <n-popselect v-model:value="待分配的飞船ID" :options="闲置飞船选项" trigger="click"
                                        @update:value="(val) => 分配飞船入列(val, route.id)">
                                        <n-button size="small" block dashed type="primary" style="margin-top: 6px;">➕
                                            分配闲置飞船</n-button>
                                    </n-popselect>
                                </div>
                            </n-collapse-item>
                        </n-collapse>

                        <n-empty v-if="获取组内航线(组名).length === 0" description="空分组" style="margin: 8px 0;" />
                    </n-collapse-item>
                </n-collapse>
            </div>

            <div
                style="flex: 1; display: flex; flex-direction: column; min-height: 0; background-color: var(--n-color-modal);">
                <div style="padding: 10px 12px; border-bottom: 1px solid var(--n-border-color); flex-shrink: 0;">
                    <n-text depth="3" style="font-size: 12px;">💤 闲置舰队 ({{ 闲置飞船选项.length }}艘可用)</n-text>
                </div>

                <div
                    style="flex: 1; overflow-y: auto; padding: 8px 12px; display: flex; flex-direction: column; gap: 8px;">
                    <div v-for="option in 闲置飞船选项" :key="option.value" class="idle-ship-card">
                        <n-text strong style="font-size: 12px;">{{ option.label }}</n-text>
                        <n-flex style="margin-top: 6px;" :size="4">
                            <n-tag size="tiny" type="info" :bordered="false" style="font-size: 10px; height: 18px;">
                                💨推力: {{ 格式化数字(飞船库.获取飞船总推力(option.value)) }}
                            </n-tag>
                            <n-tag size="tiny" type="warning" :bordered="false" style="font-size: 10px; height: 18px;">
                                📦容量: {{ 格式化字节(飞船库.获取飞船最大容量(option.value)) }}
                            </n-tag>
                            <n-tag size="tiny" type="warning" :bordered="false">
                                🧠导航: {{ 飞船库.获取飞船导航能力(option.value) }}
                            </n-tag>
                            <n-tag size="tiny" type="warning" :bordered="false">
                                📶带宽: {{ 格式化字节(飞船库.获取飞船网卡带宽(option.value)) }}
                            </n-tag>
                        </n-flex>
                    </div>
                </div>
            </div>

        </n-layout-sider>

        <n-layout-content
            style="padding: 24px; background-color: var(--n-color); display: flex; flex-direction: column;">

            <div v-if="!当前选中航线" class="empty-state-wrapper">
                <n-empty description="请在左侧展开并选择一条航线进行编排" size="huge" />
            </div>

            <div v-else class="route-editor-wrapper">
                <n-flex justify="space-between" align="center" style="margin-bottom: 24px;">
                    <h2>📍 {{ 当前选中航线.名称 }} - 航线流水线</h2>
                    <n-button type="primary" size="large" @click="保存航线节点(当前选中航线.id)">
                        💾 保存并同步给 {{ 当前选中航线.分配的飞船.length }} 艘飞船
                    </n-button>
                </n-flex>

                <div style="flex: 1; overflow-y: auto; padding-right: 12px;">
                    <hang_xian_jie_dian_bian_ji v-model="编辑中的航线草稿" />
                </div>
            </div>
        </n-layout-content>
    </n-layout>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useMessage } from 'naive-ui';
import { use航线调度系统 } from '../store_hang_xian.js';
import { use飞船实体系统 } from '../store_fei_chuan.js';
import hang_xian_jie_dian_bian_ji from './4_hang_xian_jie_dian_bian_ji.vue';

// 引入工具函数与点火引擎
import { 格式化数字, 格式化字节 } from '@/shared/gong_ju.js';
import { use物流引擎 } from '../composables/wu_liu_guan_li.js';

const message = useMessage();
const 航线库 = use航线调度系统();
const 飞船库 = use飞船实体系统();
const { 触发启航, 触发强制停泊 } = use物流引擎();

// ========== 状态控制与草稿机制 ==========
const 选中航线ID = ref(null);
const 当前选中航线 = computed(() => 航线库.航线蓝图库[选中航线ID.value] || null);

const 编辑中的航线草稿 = ref([]);

watch(选中航线ID, (newId) => {
    if (newId && 航线库.航线蓝图库[newId]) {
        编辑中的航线草稿.value = JSON.parse(JSON.stringify(航线库.航线蓝图库[newId].航线指令));
    } else {
        编辑中的航线草稿.value = [];
    }
});


// ========== 分组与航线增删改 ==========
const 编辑中的分组 = ref(null);
const 编辑中的航线 = ref(null);
const 临时输入值 = ref('');

const 触发新建分组 = () => {
    const 新组名 = '新分组_' + Date.now().toString().slice(-4);
    航线库._创建分组(新组名);
};
const 进入分组改名 = (组名) => {
    编辑中的分组.value = 组名;
    临时输入值.value = 组名;
};
const 保存分组改名 = (老组名) => {
    if (临时输入值.value && 临时输入值.value !== 老组名) {
        航线库._修改分组名称(老组名, 临时输入值.value);
    }
    编辑中的分组.value = null;
};
const 触发新建航线 = (组名) => {
    航线库._创建航线蓝图('新建物流专线', 组名);
};
const 进入航线改名 = (routeId) => {
    编辑中的航线.value = routeId;
    临时输入值.value = 航线库.航线蓝图库[routeId].名称;
};
const 保存航线改名 = (routeId) => {
    if (临时输入值.value) {
        航线库._修改航线名称(routeId, 临时输入值.value);
    }
    编辑中的航线.value = null;
};
const 获取组内航线 = (组名) => {
    return Object.values(航线库.航线蓝图库).filter(r => r.分组 === 组名);
};


// ========== 舰队编组逻辑 ==========
const 获取飞船 = (shipId) => 飞船库.获取飞船(shipId); // 提供给模板的辅助方法

// 🌟 新增：动态推算剩余到达时间 ETA
const 计算剩余时间 = (shipId) => {
    const ship = 飞船库.获取飞船(shipId);
    if (!ship || ship.当前状态 !== '航行中') return '';

    // 复刻底层的速度算法以推算剩余时间
    const 总推力 = 飞船库.获取飞船总推力(shipId);
    const 总质量 = 飞船库.获取飞船总质量(shipId);
    const 速度 = Math.max(0.1, 总推力 / Math.max(1, 总质量));
    const 目标距离 = 1000; // 底层设定的默认星际距离
    const 每秒增加进度 = (速度 / 目标距离) * 100;

    if (每秒增加进度 <= 0) return '∞';
    const 剩余秒 = (100 - ship.航行进度) / 每秒增加进度;

    return 剩余秒 > 60 ? `${(剩余秒 / 60).toFixed(1)}m` : `${Math.ceil(剩余秒)}s`;
};

const 已分配飞船ID集 = computed(() => {
    const ids = new Set();
    Object.values(航线库.航线蓝图库).forEach(r => r.分配的飞船.forEach(id => ids.add(id)));
    return ids;
});

const 闲置飞船选项 = computed(() => {
    return Object.values(飞船库.舰队库)
        .filter(ship => !已分配飞船ID集.value.has(ship.id))
        .map(ship => ({ label: `🚀 ${ship.名称}`, value: ship.id }));
});

const 待分配的飞船ID = ref(null);
const 分配飞船入列 = (shipId, routeId) => {
    if (shipId) {
        航线库._分配飞船到航线(shipId, routeId);
        const route = 航线库.航线蓝图库[routeId];
        if (route && route.航线指令 && route.航线指令.length > 0) {
            触发启航(shipId, JSON.parse(JSON.stringify(route.航线指令)));
        }
    }
    待分配的飞船ID.value = null;
};

const 踢出航线 = (shipId, routeId) => {
    航线库._将飞船踢出航线(shipId, routeId);
    触发强制停泊(shipId);
};


// ========== UI 辅助：自动提取物资标签 ==========
const 提取航线物资 = (route) => {
    const tags = new Set();
    if (route && route.航线指令) {
        route.航线指令.forEach(node => {
            if (node.操作列表) {
                node.操作列表.forEach(action => {
                    if (action.物品id) tags.add(action.物品id);
                });
            }
        });
    }
    return Array.from(tags);
};


// ========== 右侧保存按钮 ==========
const 保存航线节点 = (routeId) => {
    const hasError = 编辑中的航线草稿.value.some(node => {
        if (!node.节点星系CID) return true;
        return node.操作列表.some(action => !action.物品id);
    });

    if (hasError) {
        message.error('保存失败：存在未选择目标星系或物资的动作区块！');
        return;
    }

    航线库._保存并同步航线规则(routeId, 编辑中的航线草稿.value);

    const route = 航线库.航线蓝图库[routeId];
    if (route && route.分配的飞船) {
        route.分配的飞船.forEach(shipId => {
            触发启航(shipId, JSON.parse(JSON.stringify(编辑中的航线草稿.value)));
        });
    }

    message.success(`航线已更新，并成功同步指令给 ${当前选中航线.value.分配的飞船.length} 艘舰队！`);
};
</script>

<style scoped>
/* 状态圆点 */
.status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 6px;
}

.status-dot.active {
    background-color: #18a058;
    box-shadow: 0 0 4px #18a058;
}

.status-dot.idle {
    background-color: #f0a020;
}

/* 🌟 改造2：极致压缩折叠面板高度 */
:deep(.n-collapse-item__header) {
    padding: 6px 4px !important;
    min-height: 28px !important;
}

:deep(.n-collapse-item__content-inner) {
    padding-top: 0 !important;
    padding-bottom: 6px !important;
}

.custom-route-item {
    background-color: var(--n-color-modal);
    margin-bottom: 2px;
    border-radius: 4px;
    border-left: 2px solid transparent;
}

.custom-route-item:hover {
    border-left-color: #18a058;
}

.route-body {
    padding: 6px;
    background-color: rgba(0, 0, 0, 0.02);
    border-top: 1px dashed var(--n-border-color);
}

.cargo-tags {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;
}

/* 🌟 航线下的动态船只微型面板 */
.assigned-ship-item {
    display: flex;
    flex-direction: column;
    padding: 6px 8px;
    background-color: var(--n-color);
    border: 1px solid var(--n-border-color);
    border-radius: 4px;
}

/* 🌟 新增：闲置飞船微型卡片样式 */
.idle-ship-card {
    background-color: var(--n-color);
    border: 1px dashed var(--n-border-color);
    border-radius: 6px;
    padding: 8px 10px;
    transition: all 0.2s;
}

.idle-ship-card:hover {
    border-color: #18a058;
    background-color: rgba(24, 160, 88, 0.05);
}

.empty-state-wrapper {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.route-editor-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
}
</style>