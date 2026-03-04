<template>
  <div v-if="ship" class="drawer-container">
    
    <div class="name-header">
      <div v-if="!isEditingName" class="display-row" @click="开始编辑名称">
        <n-text strong class="ship-title">🚀 {{ ship.名称 }}</n-text>
        <n-button size="tiny" quaternary circle>
          <template #icon>✏️</template>
        </n-button>
      </div>
      <div v-else class="edit-row">
        <n-input 
          v-model:value="临时名称" 
          size="small" 
          placeholder="请输入飞船名称..."
          @blur="保存名称"
          @keyup.enter="保存名称"
          @keyup.esc="isEditingName = false"
          auto-focus
        />
      </div>
    </div>

    <n-divider dashed style="margin: 0 0 16px 0;">
        <n-text depth="3" style="font-size: 12px;">危险操作区</n-text>
    </n-divider>

    <n-popconfirm @positive-click="执行解体">
      <template #trigger>
        <n-button block type="error" ghost size="small">
          ⚠️ 强制解体飞船
        </n-button>
      </template>
      确定要拆解这艘飞船吗？所有挂载的硬件和货舱内的物资都将退回星系仓库，飞船实体将被永久销毁！
    </n-popconfirm>

    <n-divider style="margin: 16px 0;" />

    <div class="slot-group">
      <n-text depth="3" class="slot-title">主框架 (船体)</n-text>
      
      <div v-if="ship.装备的船体" class="hardware-item">
        <div style="display: flex; align-items: center; gap: 8px;">
            <wu_pin_chao_lian_jie :id="ship.装备的船体" />
            <n-tag size="small" type="primary" :bordered="false">
              质量: {{ 获取物品数据(ship.装备的船体)?.基础质量 || 0 }}
            </n-tag>
        </div>
        <n-button size="tiny" type="error" ghost @click="执行卸载船体">拔出</n-button>
      </div>
      
      <div v-else class="hardware-empty">
        <n-select 
          v-model:value="待装船体" 
          :options="可用船体选项" 
          placeholder="选择库存船体..." 
          size="small"
          style="flex: 1;" 
        />
        <n-button size="small" type="primary" @click="执行安装船体" :disabled="!待装船体">
          安装
        </n-button>
      </div>
    </div>

    <n-divider style="margin: 16px 0;" />

    <div :style="{ opacity: ship.装备的船体 ? 1 : 0.4, pointerEvents: ship.装备的船体 ? 'auto' : 'none' }">
      
      <div class="slot-group">
        <n-text depth="3" class="slot-title">
          引擎插槽 - {{ ship.装备的引擎.length }} / {{ 槽位限制.引擎 }}
        </n-text>
        <div v-for="(id, index) in ship.装备的引擎" :key="'engine-' + index" class="hardware-item">
          <wu_pin_chao_lian_jie :id="id" />
          <n-tag size="small" type="success" :bordered="false">+{{ 获取物品数据(id)?.推力 }} 推力</n-tag>
          <n-button size="tiny" type="error" ghost @click="尝试卸载模块(shipId, '装备的引擎', index)">拔出</n-button>
        </div>
        <div v-for="i in 剩余槽位.引擎" :key="'empty-engine-' + i" class="hardware-empty">
          <n-select 
            :value="null" :options="可用引擎选项" placeholder="空槽位 - 点击安装引擎..." size="small"
            @update:value="(val) => 尝试安装模块(shipId, '装备的引擎', val)" 
          />
        </div>
      </div>

      <div class="slot-group">
        <n-text depth="3" class="slot-title">
          货舱 (硬盘) 插槽 - {{ ship.装备的硬盘.length }} / {{ 槽位限制.硬盘 }}
        </n-text>
        <div v-for="(id, index) in ship.装备的硬盘" :key="'hdd-' + index" class="hardware-item">
          <wu_pin_chao_lian_jie :id="id" />
          <n-tag size="small" type="warning" :bordered="false">+{{ 格式化字节(获取物品数据(id)?.提供容量) }}</n-tag>
          <n-button size="tiny" type="error" ghost @click="尝试卸载模块(shipId, '装备的硬盘', index)">拔出</n-button>
        </div>
        <div v-for="i in 剩余槽位.硬盘" :key="'empty-hdd-' + i" class="hardware-empty">
          <n-select 
            :value="null" :options="可用硬盘选项" placeholder="空槽位 - 点击安装货舱..." size="small"
            @update:value="(val) => 尝试安装模块(shipId, '装备的硬盘', val)" 
          />
        </div>
      </div>

      <div class="slot-group">
        <n-text depth="3" class="slot-title">
          吞吐网卡插槽 - {{ ship.装备的网卡.length }} / {{ 槽位限制.网卡 }}
        </n-text>
        <div v-for="(id, index) in ship.装备的网卡" :key="'nic-' + index" class="hardware-item">
          <wu_pin_chao_lian_jie :id="id" />
          <n-tag size="small" type="info" :bordered="false">{{ 获取物品数据(id)?.传输带宽 }} B/s</n-tag>
          <n-button size="tiny" type="error" ghost @click="尝试卸载模块(shipId, '装备的网卡', index)">拔出</n-button>
        </div>
        <div v-for="i in 剩余槽位.网卡" :key="'empty-nic-' + i" class="hardware-empty">
          <n-select 
            :value="null" :options="可用网卡选项" placeholder="空槽位 - 点击安装网卡..." size="small"
            @update:value="(val) => 尝试安装模块(shipId, '装备的网卡', val)" 
          />
        </div>
      </div>

      <div class="slot-group">
        <n-text depth="3" class="slot-title">
          导航与辅助插槽 - {{ ship.装备的辅助.length }} / {{ 槽位限制.辅助 }}
        </n-text>
        <div v-for="(id, index) in ship.装备的辅助" :key="'aux-' + index" class="hardware-item">
          <wu_pin_chao_lian_jie :id="id" />
          <n-tag size="small" type="primary" :bordered="false">{{ 获取物品数据(id)?.最大航线节点 }} 节点</n-tag>
          <n-button size="tiny" type="error" ghost @click="尝试卸载模块(shipId, '装备的辅助', index)">拔出</n-button>
        </div>
        <div v-for="i in 剩余槽位.辅助" :key="'empty-aux-' + i" class="hardware-empty">
          <n-select 
            :value="null" :options="可用辅助选项" placeholder="空槽位 - 点击安装导航仪..." size="small"
            @update:value="(val) => 尝试安装模块(shipId, '装备的辅助', val)" 
          />
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useMessage, useThemeVars } from 'naive-ui';
import { use飞船实体系统 } from '../store_fei_chuan.js';
import { use飞船硬件调度 } from '../composables/fei_chuan_ying_jian.js';
import { use库存 } from '@/features/wu_pin_xi_tong/index.js';
import { 获取物品数据, 获取所有物品列表 } from '@/shared/pei_zhi_shu_ju.js';
import { 格式化字节 } from '@/shared/gong_ju.js';

const props = defineProps({
  shipId: { type: String, required: true }
});

const isEditingName = ref(false);
const 临时名称 = ref('');

const 开始编辑名称 = () => {
  临时名称.value = ship.value.名称;
  isEditingName.value = true;
};

const 保存名称 = () => {
  if (临时名称.value.trim() && 临时名称.value !== ship.value.名称) {
    飞船库._修改飞船名称(props.shipId, 临时名称.value.trim());
    message.success("飞船更名成功");
  }
  isEditingName.value = false;
};

const emit = defineEmits(['close']); // 解体后抛出关闭抽屉事件
const themeVars = useThemeVars();
const message = useMessage();

const 飞船库 = use飞船实体系统();
const 库存 = use库存();
const { 尝试安装模块, 尝试卸载模块, 尝试解体飞船 } = use飞船硬件调度();

const ship = computed(() => 飞船库.获取飞船(props.shipId));
const 槽位限制 = computed(() => 飞船库.获取飞船槽位限制(props.shipId));

// 计算剩余槽位
const 剩余槽位 = computed(() => {
  if (!ship.value || !ship.value.装备的船体) return { 引擎: 0, 硬盘: 0, 网卡: 0, 辅助: 0 };
  return {
    引擎: Math.max(0, 槽位限制.value.引擎 - ship.value.装备的引擎.length),
    硬盘: Math.max(0, 槽位限制.value.硬盘 - ship.value.装备的硬盘.length),
    网卡: Math.max(0, 槽位限制.value.网卡 - ship.value.装备的网卡.length),
    辅助: Math.max(0, 槽位限制.value.辅助 - ship.value.装备的辅助.length)
  };
});

// ================= 数据源：下拉选项 =================
const 所有物品 = Object.values(获取所有物品列表());

// 辅助函数：快速生成带有库存信息的下拉选项
const 创建选项 = (条件函数) => computed(() => {
  return 所有物品
    .filter(item => 条件函数(item) && 库存.查询库存(item.id, 'cloud_item_dummy_cid') >= 1)
    .map(item => ({ 
      label: `${item.名称} (库存: ${Math.floor(库存.查询库存(item.id, 'cloud_item_dummy_cid'))})`, 
      value: item.id 
    }));
});

// 因为配置数据里，船体/引擎等属于飞船模块，硬盘和网卡属于计算机硬件
const 可用船体选项 = 创建选项(item => item.类型 === '飞船模块' && item.子类型 === '船体');
const 可用引擎选项 = 创建选项(item => item.类型 === '飞船模块' && item.子类型 === '引擎');
const 可用硬盘选项 = 创建选项(item => item.提供容量 > 0 && item.平台 === '蒸汽'); // 货舱实质是硬盘
const 可用网卡选项 = 创建选项(item => item.传输带宽 > 0);
const 可用辅助选项 = 创建选项(item => item.最大航线节点 !== undefined);

// ================= 独立补充逻辑：船体安装与卸载 =================
const 待装船体 = ref(null);

const 执行安装船体 = () => {
  if (待装船体.value && 库存.库存减少(待装船体.value, 1, 'cloud_item_dummy_cid')) {
    飞船库._安装船体(props.shipId, 待装船体.value);
    待装船体.value = null;
    message.success("船体安装成功，模块插槽已解锁！");
  }
};

const 执行卸载船体 = () => {
  const s = ship.value;
  if (s.装备的引擎.length > 0 || s.装备的硬盘.length > 0 || s.装备的网卡.length > 0 || s.装备的辅助.length > 0) {
    message.warning("无法拆除：必须先拔出所有挂载模块，才能拆卸主骨架！");
    return;
  }
  const 卸载的id = s.装备的船体;
  飞船库._卸载船体(props.shipId);
  库存.库存增加(卸载的id, 1, 'cloud_item_dummy_cid');
  message.info("船体已卸载回星系仓库。");
};

const 执行解体 = () => {
  const success = 尝试解体飞船(props.shipId);
  if (success) {
    emit('close');
  }
};
</script>

<style scoped>
.drawer-container {
  display: flex;
  flex-direction: column;
}

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
  background-color: rgba(24, 160, 88, 0.15); /* 复刻电脑插槽的高亮背景 */
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

.name-header {
  margin-bottom: 4px;
  padding: 4px 0;
}

.display-row {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s;
}

.display-row:hover {
  background-color: v-bind('themeVars.actionColor');
}

.ship-title {
  font-size: 18px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.edit-row {
  padding: 0 4px;
}
</style>