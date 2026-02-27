import { defineStore } from 'pinia';

function 速率数据模板() {
    return { 产出: 0, 消耗: 0, 需求: 0, 净值: 0 };
}

export const use全局速率 = defineStore('quan_ju_su_lv', {
    state: () => ({
        数据: {}
    }),

    actions: {
        查询速率(物品id, 属性) {
            const 速率数据 = this.数据[物品id] || 速率数据模板();
            if (!属性) return 速率数据;
            return 速率数据[属性] || 0;
        },

        写入全局速率(新账单数据) {
            this.数据 = 新账单数据;
        }
    }
})