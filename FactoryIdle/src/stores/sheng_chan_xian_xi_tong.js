// src/stores/sheng_chan_xian_xi_tong.js
import { defineStore } from 'pinia';
import { 引擎信号 } from '@/systems/quan_ju_xin_hao';

export const use生产线系统 = defineStore('sheng_chan_xian', {
    state: () => ({
        // 结构: { [cid]: [ { id, 名称, 目标物品ID, 绑定核心索引, 状态 } ] }
        数据: {
            'main_base': []
        }
    }),

    actions: {
        创建生产线(cid, 名称 = '新生产线', 核心索引 = 0) {
            if (!this.数据[cid]) this.数据[cid] = [];
            
            const lineId = 'line_' + Date.now();
            this.数据[cid].push({
                id: lineId,
                名称: 名称,
                目标物品ID: null,
                绑定核心索引: 核心索引,
                状态: '运行'
            });
            
            引擎信号.需要重新结算 = true;
            return lineId;
        },

        重命名生产线(cid, lineId, 新名称) {
            const line = this.数据[cid]?.find(l => l.id === lineId);
            if (line) line.名称 = 新名称;
        },

        删除生产线(cid, lineId) {
            // 这里需要注意：删除生产线前，需要把属于该线的机器退回仓库
            // 这部分逻辑建议写在调度层（Composable）里
            const index = this.数据[cid]?.findIndex(l => l.id === lineId);
            if (index !== -1) {
                this.数据[cid].splice(index, 1);
                引擎信号.需要重新结算 = true;
            }
        },

        // ================= 存档接口 =================
        导出数据() { return this.$state; },
        导入数据(存档数据) { if (存档数据) this.$patch(存档数据); }
    }
});