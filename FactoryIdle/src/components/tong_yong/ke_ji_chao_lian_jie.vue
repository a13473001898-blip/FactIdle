<template>
    <n-popover trigger="hover" placement="right" :keep-alive-on-hover="true"
        style="padding: 0; background: transparent; box-shadow: none;">
        <template #trigger>
            <n-tag :type="已解锁 ? 'success' : (可解锁 ? 'info' : 'default')" style="cursor: pointer; transition: all 0.2s;"
                class="tech-link-tag" @click="触发跳转">
                {{ 获取科技数据(id)?.名称 || id }}
            </n-tag>
        </template>

        <div
            class="tech-popover-container"
            :style="{ 
                backgroundColor: themeVars.cardColor, 
                border: `1px solid ${themeVars.borderColor}` 
            }"
        >
            <ke_ji_ka_pian :id="id" />
        </div>
    </n-popover>
</template>

<script setup>
import { computed, inject } from 'vue';
import { 获取科技数据 } from '@/pei_zhi_shu_ju.js';
import ke_ji_ka_pian from '@/components/ke_ji_xi_tong/ke_ji_ka_pian.vue';
import { use科技系统 } from '@/stores/ke_ji_xi_tong.js';
import { useThemeVars } from 'naive-ui';

const themeVars = useThemeVars();
const props = defineProps({
    id: { type: String, required: true }
});

const 科技系统 = use科技系统();
const 全局跳转 = inject('全局跳转科技');

const 已解锁 = computed(() => 科技系统.已解锁科技.includes(props.id));
const 可解锁 = computed(() => 科技系统.可研发科技列表.some(t => t.id === props.id));

const 触发跳转 = () => {
    if (全局跳转) 全局跳转(props.id);
};
</script>

<style scoped>
.tech-popover-container {
    width: 260px; 
    box-shadow: 0 8px 24px rgba(0,0,0,0.12); 
    border-radius: 6px; 
    overflow: hidden;
}
.tech-link-tag:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>