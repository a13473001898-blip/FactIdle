// src/stores/pei_fang_fen_pei.js
import { defineStore } from 'pinia';
import { use库存 } from '@/stores/ku_cun.js';
import { 获取建筑数据, 获取物品数据 } from '@/pei_zhi_shu_ju.js'; 
import { 引擎信号 } from '@/systems/quan_ju_xin_hao';
import { use计算机系统 } from '@/stores/ji_suan_ji_xi_tong.js';
import { use殖民地系统 } from '@/stores/zhi_min_di_xi_tong.js';

function 配方分配数据模板(状态 = '运行') {
    return { 数量: 0, 状态: 状态 }
}

export const use配方分配 = defineStore('pei_fang_fen_pei', {
    state: () => ({
        数据: { 'main_base': {} }
    }),

    actions: {
        // 🟢 【读操作专用】
        _getColonyIdForRead(colonyId) { 
            if (colonyId) return colonyId;
            return use殖民地系统().当前视角ID; 
        },

        // ================= 查询接口 (读操作，保持宽容) =================
        查询全部(colonyId) { return this.数据[this._getColonyIdForRead(colonyId)] || {}; },
        查询建筑(配方id, colonyId) { return this.数据[this._getColonyIdForRead(colonyId)]?.[配方id] || {}; },
        查询分配数量(配方id, 建筑id, colonyId) { return this.数据[this._getColonyIdForRead(colonyId)]?.[配方id]?.[建筑id]?.数量 || 0; },
        查询建筑状态(配方id, 建筑id, colonyId) { return this.数据[this._getColonyIdForRead(colonyId)]?.[配方id]?.[建筑id]?.状态 || '运行'; },

        查询指定能源类型建筑(能源类型, colonyId) {
            const cid = this._getColonyIdForRead(colonyId);
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

        增加分配数量(配方id, 建筑id, 数量, colonyId) {
            // 🚨 强校验防火墙
            if (!colonyId) {
                console.error(`🚨 [致命防御] 尝试在星球增加建筑 [${建筑id}] 分配，但未提供 colonyId！`);
                return false;
            }
            const cid = colonyId;
            const 库存 = use库存();
            const 计算机 = use计算机系统();

            const 当前库存 = 库存.查询库存(建筑id); // 建筑是云端资产，不需要传 cid
            let 实际增加数量 = Math.floor(Math.min(数量, 当前库存));
            if (实际增加数量 <= 0) return true;

            const 物品数据 = 获取物品数据(建筑id);
            const 单台内存 = 物品数据?.字节 || 1;
            
            if (单台内存 > 0) {
                const 剩余内存 = Math.max(0, 计算机.总内存容量(cid) - 计算机.已用内存容量(cid)); 
                const 内存允许最大数量 = Math.floor(剩余内存 / 单台内存);
                实际增加数量 = Math.min(实际增加数量, 内存允许最大数量);

                if (实际增加数量 <= 0 || isNaN(实际增加数量)) return false;
            }

            // 扣除云端建筑库存
            if (!库存.库存减少(建筑id, 实际增加数量, 'cloud_item_dummy_cid')) return true; // 注意：云端物品内部机制会忽略后面的cid，但为了严谨可随便传一个

            this.初始化配方分配数据(配方id, 建筑id, cid);
            this.数据[cid][配方id][建筑id].数量 += 实际增加数量;

            引擎信号.需要重新结算 = true;
            return true;
        },

        减少分配数量(配方id, 建筑id, 数量, colonyId) {
            if (!colonyId) {
                console.error(`🚨 [致命防御] 尝试在星球减少建筑 [${建筑id}] 分配，但未提供 colonyId！`);
                return;
            }
            const cid = colonyId;
            const 库存 = use库存();
            
            const 当前数量 = this.查询分配数量(配方id, 建筑id, cid);
            const 实际减少数量 = Math.floor(Math.min(数量, 当前数量));
            if (实际减少数量 <= 0) return;

            this.数据[cid][配方id][建筑id].数量 -= 实际减少数量;
            库存.库存增加(建筑id, 实际减少数量, 'cloud_item_dummy_cid'); 

            if (this.数据[cid][配方id][建筑id].数量 <= 0) {
                delete this.数据[cid][配方id][建筑id];
            }
            引擎信号.需要重新结算 = true;
        },

        切换建筑状态(配方id, 建筑id, colonyId) {
            if (!colonyId) {
                console.error(`🚨 [致命防御] 尝试切换建筑 [${建筑id}] 状态，但未提供 colonyId！`);
                return;
            }
            const cid = colonyId;
            const 建筑数据 = this.数据?.[cid]?.[配方id]?.[建筑id];
            if (!建筑数据) return;
            建筑数据.状态 = 建筑数据.状态 === '运行' ? '停止' : '运行';
            引擎信号.需要重新结算 = true;
        },

        // ================= 存档接口 =================
        导出数据() { return this.$state; },
        导入数据(存档数据, 版本号) { if (存档数据) this.$patch(存档数据); }
    }
});