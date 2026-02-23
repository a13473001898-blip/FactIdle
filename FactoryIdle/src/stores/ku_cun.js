
import { defineStore } from 'pinia'
import { use全局速率 } from './su_lv'


export const use库存 = defineStore('ku_cun', {
    state: () => ({
        数据: {
            kuang_ji: 5000,
            zu_zhuang_ji: 5000,
            shi_lu: 5000,
            guo_lu: 5000,
            shi_yan_shi: 5000
        }
    }),

    actions: {
        查询库存(id) {
            return this.数据[id] || 0
        },

        库存增加(id, 数量, 倍率 = 1) {
            const 全局速率 = use全局速率()
            if (数量 < 0) return
            if (!this.数据[id]) this.数据[id] = 0

            //库存上限判断
            const 之前的库存 = this.数据[id];
            this.数据[id] += 数量 * 倍率

            if (之前的库存 <= 0 && this.数据[id] > 0) {
                全局速率.更新全局速率();
            }
            
        },

        库存减少(id, 数量, 倍率 = 1) {
            if (数量 < 0) return false
            if (!this.数据[id]) this.数据[id] = 0

            const 实际减少量 = 数量 * 倍率

            if (this.数据[id] < 实际减少量) return false

            this.数据[id] -= 实际减少量
            return true
        },

        库存检查(输入数组, 倍率 = 1) {
            if (!输入数组 || 输入数组.length === 0) return true
            for (const 输入 of 输入数组) {
                const 库存物品 = this.数据[输入.id] || 0
                if (库存物品 < 输入.数量 * 倍率) return false
            }
            return true
        },
    }

})