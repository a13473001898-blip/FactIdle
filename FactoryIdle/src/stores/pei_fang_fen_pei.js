// src/stores/pei_fang_fen_pei.js
import { defineStore } from 'pinia';
import { 获取建筑数据, 获取物品数据 } from '@/pei_zhi_shu_ju.js';
import { 引擎信号 } from '@/systems/quan_ju_xin_hao';
import { 读取cid } from '@/gong_ju.js';

function 配方分配数据模板(状态 = '运行') {
    return { 数量: 0, 状态: 状态 }
}

export const use配方分配 = defineStore('pei_fang_fen_pei', {
    state: () => ({
        数据: { 'main_base': {} }
    }),

    actions: {
        // ================= 查询接口 (读操作，保持宽容) =================
        查询全部(colonyId) { return this.数据[读取cid(colonyId)] || {}; },
        查询建筑(配方id, colonyId) { return this.数据[读取cid(colonyId)]?.[配方id] || {}; },
        查询分配数量(配方id, 建筑id, colonyId) { return this.数据[读取cid(colonyId)]?.[配方id]?.[建筑id]?.数量 || 0; },
        查询建筑状态(配方id, 建筑id, colonyId) { return this.数据[读取cid(colonyId)]?.[配方id]?.[建筑id]?.状态 || '运行'; },

        查询指定能源类型建筑(能源类型, colonyId) {
            const cid = 读取cid(colonyId);
            const 结果 = {};
            const 本地数据 = this.数据[cid] || {};
            for (const 配方ID in 本地数据) {
                for (const 建筑ID in 本地数据[配方ID]) {
                    const 建筑数据 = 获取建筑数据(建筑ID);
                    if (建筑数据 && 建筑数据.能源类型 === 能源类型) {
                        const 分配状态 = 本地数据[配方ID][建筑ID];
                        if (!结果[建筑ID]) 结果[建筑ID] = { 运行数量: 0, 停止数量: 0, 能耗: 建筑数据.能耗 || 0 };
                        if (分配状态.状态 === '运行') 结果[建筑ID].运行数量 += 分配状态.数量;
                        else 结果[建筑ID].停止数量 += 分配状态.数量;
                    }
                }
            }
            return 结果;
        },

        // ================= 操作接口 (写操作，实行暴政) =================
        初始化配方分配数据(配方id, 建筑id, colonyId) {
            if (!colonyId) {
                console.error(`🚨 [致命防御] 初始化配方分配失败：未提供 colonyId！`);
                return;
            }
            const cid = colonyId;
            if (!this.数据[cid]) this.数据[cid] = {};
            if (!this.数据[cid][配方id]) this.数据[cid][配方id] = {};
            if (!this.数据[cid][配方id][建筑id]) this.数据[cid][配方id][建筑id] = 配方分配数据模板();
        },

        _增加数量(配方id, 建筑id, 数量, colonyId) {
            const cid = colonyId; 
            this.初始化配方分配数据(配方id, 建筑id, cid);
            this.数据[cid][配方id][建筑id].数量 += 数量; // 👈 修复：使用传入的 数量 参数
            引擎信号.需要重新结算 = true;
        },

        _减少数量(配方id, 建筑id, 数量, colonyId) {
            const cid = colonyId; 
            this.数据[cid][配方id][建筑id].数量 -= 数量; // 👈 修复：使用传入的 数量 参数
            if (this.数据[cid][配方id][建筑id].数量 <= 0) {
                delete this.数据[cid][配方id][建筑id];
            }
            引擎信号.需要重新结算 = true;
        },

        _切换状态(配方id, 建筑id, colonyId) {
            const cid = colonyId; 
            const 建筑数据 = this.数据?.[cid]?.[配方id]?.[建筑id];
            if (!建筑数据) return;
            建筑数据.状态 = 建筑数据.状态 === '运行' ? '停止' : '运行';
            引擎信号.需要重新结算 = true;
        },

        初始化新殖民地(cid) {
            if (!cid) return;
            if (!this.数据[cid]) this.数据[cid] = {};
        },

        // ================= 存档接口 =================
        导出数据() { return this.$state; },
        导入数据(存档数据, 版本号) { if (存档数据) this.$patch(存档数据); }
    }
});