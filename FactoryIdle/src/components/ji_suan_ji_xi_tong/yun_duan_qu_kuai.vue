<template>
    <div>
        <n-flex justify="space-between" align="center" style="margin-bottom: 8px;">
            <n-text depth="3" style="font-size: 12px;">全网云端负荷</n-text>
            <n-text strong :type="云端报警 ? 'error' : 'primary'">
                {{ 格式化字节(计算机.全网已用云端容量) }} / {{ 格式化字节(计算机.全网总云端容量) }}
            </n-text>
        </n-flex>
        
        <n-progress 
            type="line" 
            :percentage="云端使用率" 
            :show-indicator="false" 
            :status="云端报警 ? 'error' : 'success'" 
            style="height: 6px; margin-bottom: 16px;" 
        />

        <div class="cloud-allocator-box">
            <n-text depth="3" class="allocator-title">
                上行链路划拨 (占用本地物体硬盘)
            </n-text>
            
            <n-flex align="center" :wrap="false">
                <n-input-number
                    :value="本地云端配额"
                    :step="1024" 
                    :min="0"
                    size="small"
                    style="flex: 1;"
                    :disabled="禁止分配"
                    @update:value="更新本地云端配额"
                />
                <n-text depth="3" class="allocator-value">
                    {{ 格式化字节(本地云端配额) }}
                </n-text>
            </n-flex>
            
            <n-text depth="3" class="allocator-hint" :type="禁止分配 ? 'error' : 'default'">
                {{ 禁止分配 ? '⚠️ 本地未挂载任何物理硬盘，无法为云端提供上行存储。' : '* 增加此数值会牺牲本地物体存储，为全网提供放置机器和硬件的算力空间。' }}
            </n-text>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { use计算机系统 } from '@/stores/ji_suan_ji_xi_tong.js';
import { use殖民地系统 } from '@/stores/zhi_min_di_xi_tong.js';
import { 格式化字节 } from '@/gong_ju';
import { use硬件调度 } from '@/composables/ying_jian_diao_du.js'; // 🌟 引入

const 计算机 = use计算机系统();
const 殖民地系统 = use殖民地系统();
const { 尝试设置云端配额 } = use硬件调度(); // 🌟 解构调度方法

const 云端使用率 = computed(() => {
    if (计算机.全网总云端容量 === 0) return 0;
    return Math.min(100, (计算机.全网已用云端容量 / 计算机.全网总云端容量) * 100);
});

const 云端报警 = computed(() => 云端使用率.value > 95);

const 本地云端配额 = computed(() => 计算机._当前机箱.云端配额 || 0);

const 禁止分配 = computed(() => {
    return !计算机._当前机箱.装备的主板 || 计算机._当前机箱.装备的硬盘.length === 0;
});

const 更新本地云端配额 = (目标值) => {
    // 🌟 核心：调度层会检查减少配额是否会损坏云端资产，或增加配额是否会挤爆本地硬盘
    尝试设置云端配额(目标值 || 0, 殖民地系统.currentViewId || 殖民地系统.当前视角ID);
};
</script>

<style scoped>
.cloud-allocator-box {
    background-color: rgba(0,0,0,0.02); 
    padding: 12px; 
    border-radius: 6px; 
    border: 1px solid #eee;
}
.allocator-title { font-size: 12px; margin-bottom: 8px; display: block; }
.allocator-value { font-size: 12px; width: 80px; text-align: right; }
.allocator-hint { font-size: 11px; margin-top: 8px; display: block; }
</style>