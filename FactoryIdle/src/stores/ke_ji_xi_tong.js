import { defineStore } from 'pinia'
import { 获取建筑数据, 获取科技数据, 科技配置 } from "../pei_zhi_shu_ju.js";
import { use库存 } from '@/stores/ku_cun.js';
import { use配方分配 } from '@/stores/pei_fang_fen_pei.js';
import { use全局速率 } from '@/stores/su_lv.js'
import { use能源模块 } from '@/stores/neng_yuan_xi_tong.js';


export const use科技系统 = defineStore('ke_ji_xi_tong', {
    state: () => ({
        已解锁科技: ['chu_shi_ke_ji_t'],
        当前研发: {
            科技ID: null,      // 当前正在研究的科技
            已完成比例: 0,     // 当前的进度数值
            每秒进度比例: 0    // 给 UI 进度条显示速率用的缓存值
        },

        // 结构: { 'shi_yan_shi': { 数量: 10, 状态: '运行' } }
        实验室分配: {

        },
    }),

    getters: {
        已解锁配方: (state) => {
            const 配方Set = new Set();
            for (const techId of state.已解锁科技) {
                const 科技 = 获取科技数据(techId);
                if (科技 && 科技.解锁配方) {
                    科技.解锁配方.forEach(id => 配方Set.add(id));
                }
            }
            return Array.from(配方Set);
        },

        可研发科技列表: (state) => {
            const 已解锁 = state.已解锁科技 || [];
            return Object.values(科技配置).filter(科技 => {
                // 1. 已经解锁的就不显示了
                if (已解锁.includes(科技.id)) return false;
                // 2. 前置科技没解锁的不显示
                const 前置满足 = 科技.前置科技.every(前置id => 已解锁.includes(前置id));
                return 前置满足;
            })
        },
    },

    actions: {
        切换当前研发科技(科技ID) {
            const 全局速率 = use全局速率()
            if (this.当前研发.科技ID === 科技ID) return;

            this.当前研发.科技ID = 科技ID;
            this.当前研发.已完成比例 = 0;
            全局速率.更新全局速率();
        },

        取消当前研发() {
            if (!this.当前研发.科技ID) return;
            this.当前研发.科技ID = null;
            this.当前研发.已完成比例 = 0;
            this.当前研发.每秒进度比例 = 0;
            use全局速率().更新全局速率();
        },

        获取科研预期账单() {
            const 账单 = {};
            const 研发数据 = this.当前研发;

            if (!研发数据.科技ID) {
                研发数据.每秒进度比例 = 0;
                return 账单;
            }

            const 科技 = 获取科技数据(研发数据.科技ID);
            const 配方分配 = use配方分配();
            const 能源模块 = use能源模块();

            // 直接向调度中心查询虚拟任务 'SYS_RESEARCH'
            const 科研分配 = 配方分配.查询建筑('ke_yan');
            let 最大总产出 = 0;

            for (const 建筑id in 科研分配) {
                const 分配数据 = 科研分配[建筑id];
                if (分配数据.状态 === '运行' && 分配数据.数量 > 0) {
                    const 建筑数据 = 获取建筑数据(建筑id);
                    const 基础速度 = 建筑数据?.速度 || 1;
                    let 满足率 = 1;
                    if (建筑数据.能源类型 && 建筑数据.能源类型 !== '无') {
                        满足率 = 能源模块.数据[建筑数据.能源类型]?.满足率 || 0;
                    }
                    最大总产出 += 分配数据.数量 * 基础速度 * 满足率;
                }
            }

            if (最大总产出 === 0) {
                研发数据.每秒进度比例 = 0;
                return 账单;
            }

            const 每秒最大进度比例 = 科技.耗时 === 0 ? Infinity : 最大总产出 / 科技.耗时;
            研发数据.每秒进度比例 = 每秒最大进度比例;

            for (const 投入 of 科技.投入) {
                const 理论消耗 = 每秒最大进度比例 * 投入.数量;
                账单[投入.id] = {
                    产出: 0,
                    消耗: 理论消耗,
                    需求: 理论消耗,
                    净值: -理论消耗
                };
            }
            return 账单;
        },

        推进实际科研进度(过去的时间秒) {
            const 全局速率 = use全局速率()
            const 库存 = use库存()
            const 研发数据 = this.当前研发;

            if (!研发数据.科技ID || 研发数据.每秒进度比例 <= 0) return;

            const 科技 = 获取科技数据(研发数据.科技ID);
            let 最小满足比例 = 1;

            // 1. 寻找短板
            for (const 投入 of 科技.投入) {
                const 理论最大消耗 = 投入.数量 * 研发数据.每秒进度比例 * 过去的时间秒;
                if (理论最大消耗 > 0) {
                    const 当前库存 = 库存.数据[投入.id] || 0;
                    if (当前库存 <= 0) {
                        最小满足比例 = 0;
                        break;
                    }
                    const 当前满足比例 = 当前库存 / 理论最大消耗;
                    if (当前满足比例 < 最小满足比例) {
                        最小满足比例 = 当前满足比例;
                    }
                }
            }

            if (最小满足比例 <= 0) return;

            // 2. 真实扣除库存（修复白嫖 Bug）
            for (const 投入 of 科技.投入) {
                const 实际消耗 = 投入.数量 * 研发数据.每秒进度比例 * 过去的时间秒 * 最小满足比例;
                if (实际消耗 > 0) {
                    库存.库存减少(投入.id, 实际消耗);
                }
            }

            // 3. 推进进度
            研发数据.已完成比例 += 研发数据.每秒进度比例 * 过去的时间秒 * 最小满足比例;

            // 4. 判定完成
            if (研发数据.已完成比例 >= 1) {
                if (!this.已解锁科技.includes(科技.id)) {
                    this.已解锁科技.push(科技.id);
                }
                研发数据.科技ID = null;
                研发数据.已完成比例 = 0;
                研发数据.每秒进度比例 = 0;
                全局速率.更新全局速率();
            }
        }
    }
})