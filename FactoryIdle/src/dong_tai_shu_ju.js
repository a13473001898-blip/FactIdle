import { reactive, computed, toRefs } from "vue";
import { use科技系统 } from "./stores/ke_ji_xi_tong.js";
import { 获取建筑数据, 获取所有物品列表, 获取配方数据, 获取科技数据, 获取物品数据 } from './pei_zhi_shu_ju.js';
import { use能源模块, } from "./stores/neng_yuan_xi_tong.js";
import { use库存, } from './stores/ku_cun.js';
import { use配方分配 } from "./stores/pei_fang_fen_pei.js";
import { use全局速率 } from "./stores/su_lv.js";
import { 执行全局速率结算 } from '@/systems/jie_suan_yin_qing.js';
import { 引擎信号 } from "./systems/quan_ju_xin_hao.js";

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
let 累加器 = 0; // 这就是我们的“时间蓄水池”
const 固定步长秒 = 0.1; // 固定为 100ms (即 10 TPS)。你可以随时改成 0.2 测试 5 TPS 的效果

export function 启动游戏循环() {
    const 科技系统 = use科技系统()
    const 库存 = use库存()
    const 全局速率 = use全局速率()

    // 初始化上次时间，防止热更新导致的初始跳变
    上次时间 = Date.now();

    const loop = () => {
        const 现在时间 = Date.now();
        // 1. 计算距离上一次屏幕刷新，现实世界过去了多少秒
        let 真实流逝秒数 = (现在时间 - 上次时间) / 1000;
        上次时间 = 现在时间;

        // 2. 防网页休眠机制
        if (真实流逝秒数 > 1) {
            真实流逝秒数 = 1;
        }

        // 3. 把真实的物理时间倒进蓄水池
        累加器 += 真实流逝秒数;

        // 4. 只要池子里的时间够 0.1 秒，就执行一次逻辑计算
        while (累加器 >= 固定步长秒) {

            // ================= 逻辑帧开始 =================
            科技系统.推进实际科研进度(固定步长秒);

            for (const id in 全局速率.数据) {
                const 净值速率 = 全局速率.数据[id].净值;
                if (净值速率 === 0) continue;

                const 当前库存 = 库存.数据[id] || 0;
                const 增加量 = 净值速率 * 固定步长秒;

                if (库存.数据[id] === undefined) 库存.数据[id] = 0;
                let 预计库存 = 库存.数据[id] + 增加量;
                if (预计库存 < 0) 预计库存 = 0;

                // 判断跨越 0 边界，打上脏标记
                if ((预计库存 === 0 && 当前库存 > 0) || (预计库存 > 0 && 当前库存 <= 0)) {
                    引擎信号.需要重新结算 = true;
                }

                库存.数据[id] = 预计库存;
            }

            // 只要有任何脏标记，立刻呼叫结算引擎，并重置标记
            if (引擎信号.需要重新结算) {
                执行全局速率结算();
                引擎信号.需要重新结算 = false;
            }
            // ================= 逻辑帧结束 =================

            累加器 -= 固定步长秒;
        }

        // 6. 渲染帧不受限制，显示器刷新多快就跑多快
        requestAnimationFrame(loop);
    };

    // 启动循环
    loop();
}


