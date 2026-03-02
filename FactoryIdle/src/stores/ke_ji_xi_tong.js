import { defineStore } from 'pinia'
import { 获取科技数据, 科技配置 } from "../pei_zhi_shu_ju.js";
import { 引擎信号 } from '@/systems/quan_ju_xin_hao';

export const use科技系统 = defineStore('ke_ji_xi_tong', {
    state: () => ({
        已解锁科技: ['chu_shi_ke_ji_t'],
        当前研发: {
            科技ID: null,      
            已完成比例: 0,     
            每秒进度比例: 0    
        },
        实验室分配: {},
    }),

    getters: {
        已解锁配方: (state) => {
            const 配方Set = new Set();
            for (const techId of state.已解锁科技) {
                const 科技 = 获取科技数据(techId);
                if (科技 && 科技.解锁配方) 科技.解锁配方.forEach(id => 配方Set.add(id));
            }
            return Array.from(配方Set);
        },

        可研发科技列表: (state) => {
            const 已解锁 = state.已解锁科技 || [];
            return Object.values(科技配置).filter(科技 => {
                if (已解锁.includes(科技.id)) return false;
                return 科技.前置科技.every(前置id => 已解锁.includes(前置id));
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

        // 👇 修复点3：极简化的进度推进，去除旧版的报错代码和重复扣除逻辑
        推进实际科研进度(过去的时间秒) {
            const 研发数据 = this.当前研发;

            if (!研发数据.科技ID || 研发数据.每秒进度比例 <= 0) return;

            const 科技 = 获取科技数据(研发数据.科技ID);

            // 真正的库存扣减已经在引擎中化为“负净值”，被动态数据系统自动处理了
            // 这里只需单纯地加进度即可
            研发数据.已完成比例 += 研发数据.每秒进度比例 * 过去的时间秒;

            if (研发数据.已完成比例 >= 1) {
                if (!this.已解锁科技.includes(科技.id)) {
                    this.已解锁科技.push(科技.id);
                }
                研发数据.科技ID = null;
                研发数据.已完成比例 = 0;
                研发数据.每秒进度比例 = 0;
                引擎信号.需要重新结算 = true;
            }
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