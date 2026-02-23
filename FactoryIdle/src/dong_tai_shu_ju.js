import { reactive, computed, toRefs } from "vue";
import {use科技系统 } from "./stores/ke_ji_xi_tong.js";
import { 获取建筑数据, 获取所有物品列表, 获取配方数据, 获取科技数据, 获取物品数据 } from './pei_zhi_shu_ju.js';
import { use能源模块,} from "./stores/neng_yuan_xi_tong.js";
import {use库存,} from './stores/ku_cun.js';
import { use配方分配 } from "./stores/pei_fang_fen_pei.js";
import { use全局速率 } from "./stores/su_lv.js";

// =================游戏核心函数=================

/**
 * 通用生产函数
 * @param {string} 配方ID - 要执行的配方ID
 * @param {number} 倍率 - (可选) 生产倍数，默认为 1
 * @returns {object} - 返回结果 { success: boolean, msg: string }
 */
export function 执行配方生产(配方ID, 倍率 = 1) {
    const 库存 = use库存()
    const 配方 = 获取配方数据(配方ID);
    if (!配方) return { success: false, msg: '配方不存在' };

    // --- 第一阶段：检查原料 (Check Phase) ---
    if (!库存.库存检查(配方.输入, 倍率)) {
        const 缺少原料 = 配方.输入.find(({ id, 数量 }) => 库存.查询库存(id) < 数量 * 倍率);
        const 缺少原料名称 = 获取物品数据(缺少原料?.id)?.名称 || 缺少原料?.id || '未知原料';
        return { success: false, msg: `${缺少原料名称} 原料不足` };
    }

    // --- 第二阶段：执行扣除 (Deduct Phase) ---
    for (const 原料 of 配方.输入) {
        库存.库存减少(原料.id, 原料.数量 * 倍率)
    }

    // --- 第三阶段：执行产出 (Add Phase) ---
    for (const 产物 of 配方.输出) {
        库存.库存增加(产物.id, 产物.数量 * 倍率)
    }

    return { success: true, msg: '生产成功' };
}

let 上次时间 = Date.now();

export function 启动游戏循环() {
    const 科技系统 = use科技系统()
    const 库存 = use库存()
    const 全局速率 = use全局速率()
    const loop = () => {
        const 现在时间 = Date.now();
        let 过去的时间秒 = 现在时间 / 1000 - 上次时间 / 1000

        if (过去的时间秒 > 1) {
            过去的时间秒 = 1; 
        }

        if (现在时间 > 上次时间) {

            科技系统.推进实际科研进度(过去的时间秒);
            let 需要重新计算速率 = false
            for (const id in 全局速率.数据) {

                const 净值速率 = 全局速率.数据[id].净值
                if (净值速率 === 0) continue;
                const 当前库存 = 库存.数据[id] || 0
                const 增加量 = 净值速率 * 过去的时间秒

                if (库存.数据[id] === undefined) {
                    库存.数据[id] = 0;
                }
                const 预计库存 = 库存.数据[id] + 增加量

                if (预计库存 <= 0 && 当前库存 > 0) {
                    库存.数据[id] = 0
                    需要重新计算速率 = true
                } else if ( 预计库存 > 0 && 当前库存 <= 0 ) {
                    库存.数据[id] = 预计库存
                    需要重新计算速率 = true
                } else {
                    库存.数据[id] = 预计库存
                }
            }
            if (需要重新计算速率) {
                全局速率.更新全局速率();}
            
        }

        上次时间 = 现在时间;
        requestAnimationFrame(loop);
    };

    // 第一次启动
    loop();
}


