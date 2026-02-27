import { defineStore } from 'pinia'
import { 获取科技数据, 科技配置 } from "../pei_zhi_shu_ju.js";
import { use库存 } from '@/stores/ku_cun.js';
import { 引擎信号 } from '@/systems/quan_ju_xin_hao';


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
            if (this.当前研发.科技ID === 科技ID) return;

            this.当前研发.科技ID = 科技ID;
            this.当前研发.已完成比例 = 0;
            引擎信号.需要重新结算 = true;
        },

        取消当前研发() {
            if (!this.当前研发.科技ID) return;
            this.当前研发.科技ID = null;
            this.当前研发.已完成比例 = 0;
            this.当前研发.每秒进度比例 = 0;
            引擎信号.需要重新结算 = true;
        },

        推进实际科研进度(过去的时间秒) {
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
                引擎信号.需要重新结算 = true;;
            }
        }
    }
})