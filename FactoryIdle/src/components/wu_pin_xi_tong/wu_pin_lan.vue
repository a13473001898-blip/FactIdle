<template>
    <div style="display: flex; flex-direction: column; gap: 16px;">
        
        <n-collapse :default-expanded-names="['高级筛选']">
            <n-collapse-item title="筛选与追踪" name="高级筛选">
                <div v-memo="[选中的分类, 追踪物品ID]" style="background-color: v-bind('themeVars.actionColor'); padding: 16px; border-radius: 8px; border: v-bind('themeVars.borderColor');">
                    
                    <n-text depth="3" style="font-size: 12px; margin-bottom: 8px; display: block;">按类型筛选</n-text>
                    <n-checkbox-group v-model:value="选中的分类">
                        <n-space item-style="display: flex;">
                            <n-checkbox v-for="分类 in 分类名称列表" :key="分类" :value="分类" :label="分类" />
                        </n-space>
                    </n-checkbox-group>

                    <n-divider style="margin: 12px 0;" />

                    <n-text depth="3" style="font-size: 12px; margin-bottom: 8px; display: block;">生产链追踪 (仅显示该物品及其所有上游原料)</n-text>
                    <n-select 
                        v-model:value="追踪物品ID" 
                        :options="下拉物品选项" 
                        clearable 
                        filterable 
                        placeholder="选择一个最终产物..." 
                    />
                </div>
            </n-collapse-item>
        </n-collapse>

        <n-divider style="margin: 0;" />

        <n-empty v-if="分组后的物品列表.length === 0" description="没有符合条件的物品" style="margin-top: 40px;" />

        <n-collapse v-else :default-expanded-names="展开的面板">
            <n-collapse-item v-for="组 in 分组后的物品列表" :key="组.标题" :title="`${组.标题} (${组.列表.length})`" :name="组.标题">
                <n-flex>
                    <wu_pin_ka_pian v-for="物品 in 组.列表" :key="物品.id" :id="物品.id" class="物品卡片" :名称="物品.名称"
                        @action="点击物品卡片(物品.id)" />
                </n-flex>
            </n-collapse-item>
        </n-collapse>

    </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import Wu_pin_ka_pian from './wu_pin_ka_pian.vue';
// 引入 获取物品数据 用于查询缺失的类型
import { 物品类型, 获取所有物品列表, 物品ID, 获取所有配方列表, 获取物品数据 } from '@/pei_zhi_shu_ju';
import { useThemeVars } from 'naive-ui';
const themeVars = useThemeVars();

const emit = defineEmits(['发送物品id'])

const 点击物品卡片 = (id) => {
    emit('发送物品id', id)
}

const 分类名称列表 = Object.values(物品类型)
const 物品数组 = Object.values(获取所有物品列表())

const 选中的分类 = ref([...分类名称列表]);
const 追踪物品ID = ref(null);

const 下拉物品选项 = computed(() => {
    return 物品数组.map(w => ({
        label: w.名称,
        value: w.id
    }));
});

function 获取所有上游物品ID(目标ID, 结果集合 = new Set()) {
    if (!目标ID) return 结果集合;
    结果集合.add(目标ID); 
    const 所有配方 = Object.values(获取所有配方列表());
    const 相关配方 = 所有配方.filter(r => r.输出 && r.输出.some(out => out.id === 目标ID));

    for (const 配方 of 相关配方) {
        if (配方.输入) {
            for (const 输入 of 配方.输入) {
                if (!结果集合.has(输入.id)) { 
                    获取所有上游物品ID(输入.id, 结果集合);
                }
            }
        }
    }
    return 结果集合;
}

// 改造点3：监听追踪物品的变化，自动补全勾选对应的分类
watch(追踪物品ID, (新ID) => {
    if (新ID) {
        const 追踪白名单 = 获取所有上游物品ID(新ID);
        const 当前已勾选 = new Set(选中的分类.value);
        
        // 遍历白名单里的每一个物品，找出它们的类型
        追踪白名单.forEach(id => {
            const 物品信息 = 获取物品数据(id);
            if (物品信息 && 物品信息.类型) {
                当前已勾选.add(物品信息.类型);
            }
        });

        // 煤炭的特殊判断（因为煤炭原始类型是资源，但在这里也被分入了能源）
        if (追踪白名单.has(物品ID.煤炭)) {
            当前已勾选.add('能源');
        }

        // 把补全后的集合重新赋值给多选框
        选中的分类.value = Array.from(当前已勾选);
    }
});


const 分组后的物品列表 = computed(() => {
    let 追踪白名单 = null;
    if (追踪物品ID.value) {
        追踪白名单 = 获取所有上游物品ID(追踪物品ID.value);
    }

    // 改造点2：不再遍历 选中的分类.value，而是以固定的 分类名称列表 为主轴进行遍历
    // 这样折叠面板永远会按照：资源 -> 原材料 -> 零部件... 的固定顺序渲染
    const 结果 = 分类名称列表.map((当前分类) => {
        
        // 如果这个分类没有被勾选，直接返回 null 跳过
        if (!选中的分类.value.includes(当前分类)) return null;

        const 物品组 = 物品数组.filter((物品) => {
            if (物品.类型 !== 当前分类) return false;
            if (追踪白名单 && !追踪白名单.has(物品.id)) return false;
            return true;
        });

        if (当前分类 === '能源' && (!追踪白名单 || 追踪白名单.has(物品ID.煤炭))) {
            const 煤炭 = 物品数组.find(w => w.id === 物品ID.煤炭);
            if (煤炭 && !物品组.some(w => w.id === 物品ID.煤炭)) {
                物品组.push(煤炭);
            }
        }
        
        return { 标题: 当前分类, 列表: 物品组 };
        
    }).filter(组 => 组 !== null && 组.列表.length > 0); // 过滤掉 null 和空列表
    
    return 结果;
});

const 展开的面板 = computed(() => 分组后的物品列表.value.map(组 => 组.标题));
</script>

<style scoped>
/* 稍微美化一下顶部筛选面板的标题 */
:deep(.n-collapse-item__header) {
    font-weight: bold;
}

.物品卡片:active {
    transform: scale(0.95);
    transition: transform 0.1s;
}
</style>