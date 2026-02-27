import { defineStore } from 'pinia';
import { use库存 } from '@/stores/ku_cun.js';
import { 获取建筑数据 } from '@/pei_zhi_shu_ju.js';
import { 引擎信号 } from '@/systems/quan_ju_xin_hao';

function 配方分配数据模板(状态 = '运行') {
    return {
        数量: 0,
        状态: 状态, //默认状态为运行
    }
}

export const use配方分配 = defineStore('pei_fang_fen_pei', {
    state: () => ({
        数据: {}
    }),

    actions: {
        // ================= 查询接口 (纯读取) =================
        查询全部() {
            return this.数据
        },

        查询建筑(配方id) {
            const 建筑列表 = this.数据[配方id]
            if (!建筑列表) return {}
            return 建筑列表
        },

        查询分配数量(配方id, 建筑id) {
            const 配方数据 = this.数据[配方id]
            if (!建筑id) return 配方数据 || {}
            return 配方数据?.[建筑id]?.数量 || 0
        },

        查询建筑状态(配方id, 建筑id) {
            return this.数据[配方id]?.[建筑id]?.状态 || '运行';
        },

        查询指定能源类型建筑(能源类型) {
            const 结果 = {}
            for (const 配方ID in this.数据) {
                for (const 建筑ID in this.数据[配方ID]) {
                    const 建筑数据 = 获取建筑数据(建筑ID)
                    if (建筑数据 && 建筑数据.能源类型 === 能源类型) {
                        const 分配状态 = this.数据[配方ID][建筑ID]
                        if (!结果[建筑ID]) {
                            结果[建筑ID] = {
                                运行数量: 0,
                                停止数量: 0,
                                能耗: 建筑数据.能耗 || 0
                            }
                        }
                        if (分配状态.状态 === '运行') {
                            结果[建筑ID].运行数量 += 分配状态.数量
                        } else {
                            结果[建筑ID].停止数量 += 分配状态.数量
                        }
                    }
                }
            }
            return 结果
        },

        // ================= 操作接口 (只改数据，打上脏标记) =================
        初始化配方分配数据(配方id, 建筑id) {
            if (!this.数据[配方id]) {
                this.数据[配方id] = {}
            }
            if (!this.数据[配方id][建筑id]) {
                this.数据[配方id][建筑id] = 配方分配数据模板()
            }
        },

        增加分配数量(配方id, 建筑id, 数量) {
            const 库存 = use库存()
            const 当前库存 = 库存.查询库存(建筑id) || 0;
            const 实际增加数量 = Math.min(数量, 当前库存);
            if (实际增加数量 <= 0) return;
            if (!库存.库存减少(建筑id, 实际增加数量)) return;
            
            this.初始化配方分配数据(配方id, 建筑id);
            this.数据[配方id][建筑id].数量 += 实际增加数量;
            
            // 【改动点】：不再调 store 互相更新，而是打上脏标记，交给外部主循环统一算
            引擎信号.需要重新结算 = true;; 
        },

        减少分配数量(配方id, 建筑id, 数量) {
            const 库存 = use库存()
            const 当前数量 = this.查询分配数量(配方id, 建筑id);
            const 实际减少数量 = Math.min(数量, 当前数量)
            if (实际减少数量 <= 0) return

            this.数据[配方id][建筑id].数量 -= 实际减少数量
            库存.库存增加(建筑id, 实际减少数量)

            if (this.数据[配方id][建筑id].数量 <= 0) {
                delete this.数据[配方id][建筑id];
            }
            
            // 【改动点】：打上脏标记
            引擎信号.需要重新结算 = true;;
        },

        切换建筑状态(配方id, 建筑id) {
            const 建筑数据 = this.数据?.[配方id]?.[建筑id]
            if (!建筑数据) return
            if (建筑数据.状态 === '运行') 建筑数据.状态 = '停止'
            else {
                建筑数据.状态 = '运行'
            }
            
            // 【改动点】：打上脏标记
            引擎信号.需要重新结算 = true;
        },
    }
})