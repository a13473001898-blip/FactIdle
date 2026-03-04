<template>
  <n-flex justify="space-between" align="center" style="width: 100%;">

    <n-flex align="center" gap="16px">
      <n-button :type="游戏控制.暂停 ? 'warning' : 'primary'" strong secondary @click="游戏控制.切换暂停状态()" style="width: 100px;">
        {{ 游戏控制.暂停 ? '▶ 恢复' : '⏸ 暂停' }}
      </n-button>

      <n-select :value="殖民地系统.当前视角ID" @update:value="(val) => 殖民地系统.切换视角(val)" :options="视角选项" style="width: 180px;"
        size="medium" />

      <n-button-group>
        <n-button secondary :type="内存警告 ? 'error' : 'default'" @click="游戏控制.打开计算面板()">
          <span class="header-stat">内存: {{ 格式化字节(计算机.已用内存容量()) }}/{{ 格式化字节(计算机.总内存容量()) }}</span>
        </n-button>
        <n-button secondary :type="硬盘警告 ? 'error' : 'default'" @click="游戏控制.打开计算面板()">
          <span class="header-stat">硬盘: {{ 格式化字节(计算机.已用硬盘容量()) }}/{{ 格式化字节(计算机.总硬盘容量()) }}</span>
        </n-button>
      </n-button-group>
    </n-flex>

    <n-button-group>
      <n-button  @click="游戏控制.打开航线面板()">
        <span class="header-stat">运输总览</span>
      </n-button>
    </n-button-group>
  </n-flex>

  <n-flex gap="24px" align="center" :wrap="false">
    <div style="width: 180px; flex-shrink: 0;">
      <n-text depth="3" v-if="!科技系统.当前研发.科技ID" style="font-size: 12px;">暂无研发项目</n-text>
      <div v-else>
        <n-flex justify="space-between" align="baseline" style="margin-bottom: 2px;">
          <n-text strong class="truncate-text" style="font-size: 13px; max-width: 130px;">
            {{ 获取科技数据(科技系统.当前研发.科技ID)?.名称 }}
          </n-text>
          <n-text style="font-size: 11px; font-family: monospace;" depth="3">
            {{ Math.floor((科技系统.当前研发.已完成比例 || 0) * 100) }}%
          </n-text>
        </n-flex>
        <n-progress type="line" :percentage="(科技系统.当前研发.已完成比例 || 0) * 100" :show-indicator="false" status="info"
          processing style="height: 6px;" />
      </div>
    </div>

    <neng_yuan_jian_kong />
  </n-flex>

</template>

<script setup>
import { computed } from 'vue';
import { 获取科技数据 } from '@/shared/pei_zhi_shu_ju';
import { use科技系统 } from '@/features/ke_ji_xi_tong';
import { use游戏控制 } from '@/features/you_xi_kong_zhi';
import { use计算机系统 } from '@/features/ji_suan_ji_xi_tong';
import { 格式化数字, 格式化字节 } from '@/shared/gong_ju'
import { use游戏设置 } from '@/features/she_zhi_xi_tong/index.js';
import { use殖民地系统 } from '@/features/zhi_min_di_xi_tong';
import { neng_yuan_jian_kong } from '@/features/neng_yuan_xi_tong';

const 科技系统 = use科技系统();
const 游戏控制 = use游戏控制();
const 计算机 = use计算机系统();
const 游戏设置 = use游戏设置();
const 殖民地系统 = use殖民地系统();

const 内存警告 = computed(() => {
  // 🌟 修复：拿到值运算
  const 总容量 = 计算机.总内存容量();
  if (总容量 === 0) return true;
  const 占用率 = 计算机.已用内存容量() / 总容量;
  return 占用率 >= 游戏设置.阈值配置['内存红色报警'];
});
const 硬盘警告 = computed(() => {
  const 总容量 = 计算机.总硬盘容量();
  if (总容量 === 0) return true;
  const 占用率 = 计算机.已用硬盘容量() / 总容量;
  return 占用率 >= 游戏设置.阈值配置['硬盘红色报警'];
});

const 视角选项 = computed(() => {
  return 殖民地系统.列表.map(c => ({
    label: `📍 ${c.名称}`,
    value: c.id
  }));
});
</script>

<style scoped>
/* 原有样式保持不变 */
.header-stat {
  font-family: 'Fira Code', monospace;
  font-variant-numeric: tabular-nums;
  font-size: 13px;
  white-space: nowrap;
}

.energy-item {
  width: 145px;
  flex-shrink: 0;
}

.energy-value {
  font-size: 11px;
  font-family: 'Fira Code', monospace;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.success {
  color: #18a058;
}

.warning {
  color: #f0a020;
}

.error {
  color: #d03050;
}

.truncate-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

:deep(.n-progress-content) {
  line-height: 1 !important;
}
</style>