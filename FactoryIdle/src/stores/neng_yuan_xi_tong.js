import { defineStore } from 'pinia';
import { use游戏设置 } from '@/stores/she_zhi.js';
import { use殖民地系统 } from './zhi_min_di_xi_tong.js';
import { 读取cid } from '@/gong_ju.js';


function 能源数据模板() {
    return { 产出: 0, 需求: 0, 净值: 0, 满足率: 1, 负载率: 0 };
}

function 殖民地能源模板() {
    return { 热能: 能源数据模板(), 蒸汽: 能源数据模板(), 电力: 能源数据模板() };
}

export const use能源模块 = defineStore('neng_yuan', {
    state: () => ({
        // 结构: { colonyId: { 热能: {}, 蒸汽: {}, 电力: {} } }
        数据: {
            'main_base': 殖民地能源模板()
        },
        // 结构: { colonyId: { 消耗清单... } }
        当期能源账单: {
            'main_base': {}
        }
    }),

    getters: {
        // Getter 内部动态获取视角，UI 组件无需传 colonyId 即可自动刷新
        获取能源负载百分比: (state) => (类型, colonyId) => {
            const cid = 读取cid(colonyId);
            const 殖民地数据 = state.数据[cid] || 殖民地能源模板();
            return Math.min((殖民地数据[类型]?.负载率 || 0) * 100, 100);
        },

        获取能源状态颜色: (state) => (type, colonyId) => {
            const 游戏设置 = use游戏设置();
            const cid = colonyId || use殖民地系统().当前视角ID;
            const 殖民地数据 = state.数据[cid] || 殖民地能源模板();
            const data = 殖民地数据[type];

            if (!data) return 'success';

            const 负载 = data.负载率 || 0;
            if (data.满足率 < 1) return 'error';
            if (负载 >= 游戏设置.阈值配置['能源断供报警']) return 'error';
            if (负载 >= 游戏设置.阈值配置['能源高负载预警']) return 'warning';

            return 'success';
        },
    },

    actions: {

        写入能源数据(cid, 新能源数据, 新账单) {
            this.数据[cid] = 新能源数据;
            this.当期能源账单[cid] = 新账单;
        },

        查询负载率(类型, colonyId) {
            const cid = 读取cid(colonyId);
            return this.数据[cid]?.[类型]?.负载率 || 0
        },

        查询满足率(类型, colonyId) {
            const cid = 读取cid(colonyId);
            const data = this.数据[cid]?.[类型];
            return data !== undefined ? data.满足率 : 1;
        },

        查询能源(类型, colonyId) {
            const cid = 读取cid(colonyId);
            return this.数据[cid]?.[类型] || 能源数据模板();
        },

        获取能源账单(colonyId) {
            const cid = 读取cid(colonyId);
            return this.当期能源账单[cid] || {};
        },

        初始化新殖民地(cid) {
            if (!cid) return;
            if (!this.数据[cid]) this.数据[cid] = 殖民地能源模板();
            if (!this.当期能源账单[cid]) this.当期能源账单[cid] = {};
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