<template>
  <n-layout has-sider style="height: 100%; border: 1px solid var(--n-border-color); border-radius: 8px; overflow: hidden;">
    
    <n-layout-sider bordered width="320" content-style="display: flex; flex-direction: column; height: 100%;">
      
      <div style="padding: 12px; border-bottom: 1px solid var(--n-border-color);">
        <n-flex justify="space-between" align="center" style="margin-bottom: 12px;">
          <n-text strong style="font-size: 15px;">📜 帝国航线网络</n-text>
          <n-button size="tiny" type="primary" ghost @click="触发新建分组">📁 新建分组</n-button>
        </n-flex>
        
        <n-collapse accordion>
          <n-collapse-item v-for="组名 in 航线库.航线分组库" :key="组名" :name="组名">
            
            <template #header>
              <div v-if="编辑中的分组 === 组名" @click.stop>
                <n-input 
                  v-model:value="临时输入值" size="small" style="width: 150px;" 
                  @blur="保存分组改名(组名)" @keyup.enter="保存分组改名(组名)" auto-focus
                />
              </div>
              <n-flex v-else align="center" style="width: 100%;">
                <n-text strong>{{ 组名 }}</n-text>
                <n-button size="tiny" quaternary circle @click.stop="进入分组改名(组名)">✏️</n-button>
                <n-button size="tiny" quaternary @click.stop="触发新建航线(组名)" style="margin-left: auto;">➕ 航线</n-button>
              </n-flex>
            </template>

            <n-collapse accordion @update:expanded-names="(val) => { 选中航线ID = val[0] || null }">
              <n-collapse-item v-for="route in 获取组内航线(组名)" :key="route.id" :name="route.id" class="custom-route-item">
                
                <template #header>
                  <div v-if="编辑中的航线 === route.id" @click.stop>
                    <n-input 
                      v-model:value="临时输入值" size="small" style="width: 160px;" 
                      @blur="保存航线改名(route.id)" @keyup.enter="保存航线改名(route.id)" auto-focus
                    />
                  </div>
                  <n-flex v-else align="center" style="width: 100%;">
                    <div :class="['status-dot', route.分配的飞船.length > 0 ? 'active' : 'idle']"></div>
                    <n-text style="font-size: 13px;">{{ route.名称 }}</n-text>
                    <n-button size="tiny" quaternary circle @click.stop="进入航线改名(route.id)">✏️</n-button>
                  </n-flex>
                </template>

                <div class="route-body">
                  <div class="cargo-tags">
                    <n-text depth="3" style="font-size: 12px; margin-right: 4px;">运载:</n-text>
                    <n-tag v-for="itemId in 提取航线物资(route)" :key="itemId" size="small" :bordered="false" type="warning" style="margin-right: 4px;">
                       <wu_pin_chao_lian_jie :id="itemId" />
                    </n-tag>
                    <n-text v-if="提取航线物资(route).length === 0" depth="4" style="font-size: 12px;">暂无物流计划</n-text>
                  </div>

                  <n-divider style="margin: 8px 0;" />

                  <n-flex vertical :size="6">
                    <div v-for="shipId in route.分配的飞船" :key="shipId" class="assigned-ship-item">
                      <span style="font-size: 12px; flex: 1;">🚢 {{ 获取飞船名字(shipId) }}</span>
                      <n-button size="tiny" type="error" quaternary @click="踢出航线(shipId, route.id)">✖ 踢出</n-button>
                    </div>
                  </n-flex>

                  <n-popselect v-model:value="待分配的飞船ID" :options="闲置飞船选项" trigger="click" @update:value="(val) => 分配飞船入列(val, route.id)">
                    <n-button size="small" block dashed type="primary" style="margin-top: 8px;">➕ 分配闲置飞船</n-button>
                  </n-popselect>
                </div>
              </n-collapse-item>
            </n-collapse>
            
            <n-empty v-if="获取组内航线(组名).length === 0" description="空分组" style="margin: 12px 0;" />
          </n-collapse-item>
        </n-collapse>
      </div>
      
      <div style="flex: 1; padding: 12px; background-color: var(--n-color-modal);">
        <n-text depth="3" style="font-size: 12px;">💤 闲置舰队 ({{ 闲置飞船选项.length }}艘可用)</n-text>
      </div>
    </n-layout-sider>

    <n-layout-content style="padding: 24px; background-color: var(--n-color);">
      
      <div v-if="!当前选中航线" class="empty-state-wrapper">
        <n-empty description="请在左侧展开并选择一条航线进行节点编排" size="huge" />
      </div>

      <div v-else class="route-editor-wrapper">
        <n-flex justify="space-between" align="center" style="margin-bottom: 24px;">
          <h2>📍 {{ 当前选中航线.名称 }} - 节点流水线</h2>
          <n-button type="primary" size="large" @click="保存航线节点(当前选中航线.id)">
            💾 保存并同步给 {{ 当前选中航线.分配的飞船.length }} 艘飞船
          </n-button>
        </n-flex>

        <div style="background-color: var(--n-color-modal); padding: 40px; text-align: center; border-radius: 8px; border: 1px dashed var(--n-border-color);">
          <n-h3 depth="3">流水线规划器 (下一步攻坚点)</n-h3>
          <p style="color: #999;">这里将是一条垂直的时间线<br/>包含：星系下拉框、动作下拉框、数量输入</p>
          <n-button dashed type="info" style="margin-top: 16px;">➕ 追加目标星系</n-button>
        </div>

      </div>
    </n-layout-content>
  </n-layout>
</template>

<script setup>
import { ref, computed } from 'vue';
import { use航线调度系统 } from '../store_hang_xian.js';
import { use飞船实体系统 } from '../store_fei_chuan.js';

const 航线库 = use航线调度系统();
const 飞船库 = use飞船实体系统();

// ========== 状态控制 ==========
const 选中航线ID = ref(null);
const 当前选中航线 = computed(() => 航线库.航线蓝图库[选中航线ID.value] || null);

// 内联编辑状态
const 编辑中的分组 = ref(null);
const 编辑中的航线 = ref(null);
const 临时输入值 = ref('');

// ========== 分组与航线增删改 ==========
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
const 获取飞船名字 = (shipId) => 飞船库.获取飞船(shipId)?.名称 || '未知';

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
  if (shipId) 航线库._分配飞船到航线(shipId, routeId);
  待分配的飞船ID.value = null; // 清空选择
};
const 踢出航线 = (shipId, routeId) => {
  航线库._将飞船踢出航线(shipId, routeId);
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
  // 未来这里会把草稿箱里的节点数组传给 Store
  console.log('触发保存航线指令，ID:', routeId);
};
</script>

<style scoped>
/* 状态圆点 */
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
}
.status-dot.active { background-color: #18a058; box-shadow: 0 0 4px #18a058; }
.status-dot.idle { background-color: #f0a020; }

/* 自定义折叠面板样式，让其更紧凑 */
:deep(.n-collapse-item__header) {
  padding: 8px 4px !important;
}
.custom-route-item {
  background-color: var(--n-color-modal);
  margin-bottom: 4px;
  border-radius: 4px;
  border-left: 2px solid transparent;
}
.custom-route-item:hover { border-left-color: #18a058; }

.route-body {
  padding: 8px;
  background-color: rgba(0,0,0,0.02);
  border-top: 1px dashed var(--n-border-color);
}

.cargo-tags {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.assigned-ship-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  background-color: var(--n-color);
  border: 1px solid var(--n-border-color);
  border-radius: 4px;
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