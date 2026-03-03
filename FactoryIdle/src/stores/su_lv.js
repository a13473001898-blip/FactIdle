import { defineStore } from 'pinia';
import { 读取cid } from '@/gong_ju.js';

function 速率数据模板() {
    return { 产出: 0, 消耗: 0, 需求: 0, 净值: 0 };
}

export const use全局速率 = defineStore('quan_ju_su_lv', {
    state: () => ({
        // 结构: { colonyId: { 物品id: { 产出, 消耗, 需求, 净值 } } }
        数据: {
            'main_base': {}
        }
    }),

    actions: {

        查询速率(物品id, 属性, colonyId) {
            const cid = 读取cid(colonyId);
            const 本地速率表 = this.数据[cid] || {};
            const 速率数据 = 本地速率表[物品id] || 速率数据模板();

            if (!属性) return 速率数据;
            return 速率数据[属性] || 0;
        },

        // 给结算引擎用的，直接覆盖某个殖民地的整张账单
        写入殖民地速率(cid, 新账单数据) {
            this.数据[cid] = 新账单数据;
        },

        初始化新殖民地(cid) {
            if (!cid) return;
            if (!this.数据[cid]) this.数据[cid] = {};
        },

        // ================= 存档接口 =================
        导出数据() {
            return this.$state;
        },
        导入数据(存档数据, 版本号) {
            if (存档数据) this.$patch(存档数据);
        },
    }
})