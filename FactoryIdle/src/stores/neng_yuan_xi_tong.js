import { defineStore } from 'pinia';

function 能源数据模板() {
    return { 产出: 0, 需求: 0, 净值: 0, 满足率: 1, 负载率: 0 };
}

export const use能源模块 = defineStore('neng_yuan', {
    state: () => ({
        数据: { 热能: 能源数据模板(), 蒸汽: 能源数据模板(), 电力: 能源数据模板() },
        当期能源账单: {}
    }),
    getters: {
        获取能源负载百分比: (state) => (类型) => Math.min((state.数据[类型]?.负载率 || 0) * 100, 100),
        
        获取能源状态颜色: (state) => (type) => {
            const data = state.数据[type];
            if (!data) return 'success';
            if (data.满足率 < 1 || data.供应 === 0) return 'error';
            if (data.需求 > 0 && data.供应 > 0 && (data.需求 / data.供应) > 0.75) return 'warning';
            return 'success';
        },

    },
    actions: {
        写入能源数据(新能源数据, 新账单) {
            this.数据 = 新能源数据;
            this.当期能源账单 = 新账单;
        },

        查询负载率(类型) { return this.数据[类型]?.负载率 || 0 },

        查询满足率(类型) { return this.数据[类型]?.满足率 || 1 },

        查询能源(类型) { return this.数据[类型] },

        获取能源账单() { return this.当期能源账单; }
    }
})