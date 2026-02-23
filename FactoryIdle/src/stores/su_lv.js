import { defineStore } from 'pinia';
import { 获取所有物品列表 } from '@/pei_zhi_shu_ju.js';
// 引入需要交账单的各个子部门
import { use配方分配 } from '@/stores/pei_fang_fen_pei.js';
import { use能源模块 } from '@/stores/neng_yuan_xi_tong.js';
import { use科技系统 } from '@/stores/ke_ji_xi_tong.js'; 

function 速率数据模板() {
    return {
        产出: 0,
        消耗: 0,
        需求: 0,
        净值: 0,
    };
}

function 合并账单(总账单, 分账单) {
    for (const 物品id in 分账单) {
        if (!总账单[物品id]) {
            总账单[物品id] = 速率数据模板();
        }
        const 单项 = 分账单[物品id];
        总账单[物品id].产出 += 单项.产出 || 0;
        总账单[物品id].消耗 += 单项.消耗 || 0;
        总账单[物品id].需求 += 单项.需求 || 0;
    }
}

export const use全局速率 = defineStore('quan_ju_su_lv', {
    state: () => ({
        数据: {}
    }),

    actions: {
        查询速率(物品id, 属性) {
            const 速率数据 = this.数据[物品id] || 速率数据模板()
            if (!属性) return 速率数据
            return 速率数据[属性] || 0
        },

        

        更新全局速率() {
            const 临时总账单 = {};


            
            // 预填所有物品，防止 UI 读到 undefined 报错
            const 所有物品 = 获取所有物品列表();
            for (const key in 所有物品) {
                临时总账单[key] = 速率数据模板();
            }
            use能源模块().运行能源系统();

            const 配方账单 = use配方分配().获取配方账单(); 
            const 能源账单 = use能源模块().获取能源账单()
            //const 科技账单 = use科技系统().获取科研预期账单();

            // B. 合并账单
            if (配方账单) 合并账单(临时总账单, 配方账单);
            if (能源账单) 合并账单(临时总账单, 能源账单);
            //if (科技账单) 合并账单(临时总账单, 科技账单);

            // C. 结算净值，并覆盖到响应式 state 中
            for (const 物品id in 临时总账单) {
                const item = 临时总账单[物品id];
                item.净值 = item.产出 - item.消耗;
                this.数据[物品id] = item;
            }
            
            console.log("全局速率已更新", this.数据);
        }
    }
})