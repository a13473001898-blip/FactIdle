import { defineStore } from 'pinia';
import { use库存 } from '@/stores/ku_cun.js';
import { 获取建筑数据, 获取所有物品列表, 获取配方数据 } from '@/pei_zhi_shu_ju.js';
import { use能源模块 } from './neng_yuan_xi_tong';
import { use全局速率 } from '@/stores/su_lv.js'


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
        // ================= 查询接口 =================
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
        获取配方账单() {
            const 临时速率表 = {}
            const 库存 = use库存()
            const 能源模块 = use能源模块()

            for (const key in 获取所有物品列表()) {
                临时速率表[key] = { 产出: 0, 消耗: 0, 需求: 0, 净值: 0 };
            }

            // 2. 遍历“配方分配” (核心逻辑)
            for (const 配方ID in this.数据) {
                const 分配情况 = this.数据[配方ID];
                const 当前配方 = 获取配方数据(配方ID);
                if (当前配方.时间 === 0) continue;

                // 2.1 分别算出“理论总速度”和“实际总速度”
                let 理论总生产速度 = 0;
                let 实际总生产速度 = 0;

                for (const 建筑ID in 分配情况) {
                    if (分配情况[建筑ID].状态 !== '运行') continue;

                    const 建筑 = 获取建筑数据(建筑ID);
                    const 数量 = 分配情况[建筑ID].数量;
                    const 单个速度 = 建筑?.速度 || 0;

                    // 【核心修改1】：理论速度只看机器数量和基础速度，不管缺不缺电
                    理论总生产速度 += 数量 * 单个速度;

                    // 实际速度还要看能源满足率
                    let 机器实际满足率 = 1;
                    if (建筑.能源类型 && 建筑.能源类型 !== '无') {
                        机器实际满足率 = 能源模块.数据[建筑.能源类型]?.满足率 || 0;
                    }
                    实际总生产速度 += 数量 * 单个速度 * 机器实际满足率;
                }

                // 2.2 无论是否缺货，先把“最大需求”算出来并登记！
                const 理论每秒批次 = 理论总生产速度 / 当前配方.时间;
                for (const 原料 of 当前配方.输入) {
                    // 这是机器真实的胃口
                    临时速率表[原料.id].需求 += 理论每秒批次 * 原料.数量;
                }

                // 2.3 检查原料是否足够 (决定实际消耗和产出)
                let 原料足够 = true;
                for (const 原料 of 当前配方.输入) {
                    if ((库存.查询库存(原料.id) || 0) <= 0) {
                        原料足够 = false;
                        break;
                    }
                }

                // 如果缺料，这台机器物理停机，不产生实际消耗和产出
                if (!原料足够) {
                    continue; // 注意：此时需求已经登记进账本了，所以 UI 能够正确显示缺料报警！
                }

                // 2.4 计算实际每秒批次
                const 实际每秒批次 = 实际总生产速度 / 当前配方.时间;

                // 登记实际消耗
                for (const 原料 of 当前配方.输入) {
                    临时速率表[原料.id].消耗 += 实际每秒批次 * 原料.数量;
                }

                // 登记实际产出
                for (const 产物 of 当前配方.输出) {
                    临时速率表[产物.id].产出 += 实际每秒批次 * 产物.数量;
                }
            }

            // 3. 计算净值并写入全局数据
            for (const key in 临时速率表) {
                const item = 临时速率表[key];
                item.净值 = item.产出 - item.消耗;
            }
            return 临时速率表;
        },
        // ================= 操作接口 =================
        初始化配方分配数据(配方id, 建筑id) {
            if (!this.数据[配方id]) {
                this.数据[配方id] = {}
            }
            if (!this.数据[配方id][建筑id]) {
                this.数据[配方id][建筑id] = 配方分配数据模板()
            }
        },

        增加分配数量(配方id, 建筑id, 数量) {
            const 全局速率 = use全局速率()
            const 库存 = use库存()
            const 当前库存 = 库存.查询库存(建筑id) || 0;
            const 实际增加数量 = Math.min(数量, 当前库存);
            if (实际增加数量 <= 0) return;
            if (!库存.库存减少(建筑id, 实际增加数量)) return;
            this.初始化配方分配数据(配方id, 建筑id);
            this.数据[配方id][建筑id].数量 += 实际增加数量;
            全局速率.更新全局速率()
        },

        减少分配数量(配方id, 建筑id, 数量) {
            const 全局速率 = use全局速率()
            const 库存 = use库存()
            const 当前数量 = this.查询分配数量(配方id, 建筑id);
            const 实际减少数量 = Math.min(数量, 当前数量)
            if (实际减少数量 <= 0) return

            this.数据[配方id][建筑id].数量 -= 实际减少数量
            库存.库存增加(建筑id, 实际减少数量)



            if (this.数据[配方id][建筑id].数量 <= 0) {
                delete this.数据[配方id][建筑id];
            }
            全局速率.更新全局速率()
        },

        切换建筑状态(配方id, 建筑id) {
            const 全局速率 = use全局速率()
            const 建筑数据 = this.数据?.[配方id]?.[建筑id]
            if (!建筑数据) return
            if (建筑数据.状态 === '运行') 建筑数据.状态 = '停止'
            else {
                建筑数据.状态 = '运行'
            }
            全局速率.更新全局速率()
        },


    }
})