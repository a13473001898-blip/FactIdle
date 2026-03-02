import { defineStore } from 'pinia';
import { use殖民地系统 } from './zhi_min_di_xi_tong.js';

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
        _getColonyId(colonyId) {
            return colonyId || use殖民地系统().当前视角ID;
        },

        查询速率(物品id, 属性, colonyId) {
            const cid = this._getColonyId(colonyId);
            const 本地速率表 = this.数据[cid] || {};
            const 速率数据 = 本地速率表[物品id] || 速率数据模板();
            
            if (!属性) return 速率数据;
            return 速率数据[属性] || 0;
        },

        // 给结算引擎用的，直接覆盖某个殖民地的整张账单
        写入殖民地速率(cid, 新账单数据) {
            this.数据[cid] = 新账单数据;
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