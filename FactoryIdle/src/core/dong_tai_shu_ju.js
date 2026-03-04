import { reactive, computed, toRefs } from "vue";
import { use科技系统 } from "../features/ke_ji_xi_tong";
import { use库存, } from '@/features/wu_pin_xi_tong';
import { use全局速率 } from "../features/su_lv_xi_tong";
import { use游戏控制 } from "../features/you_xi_kong_zhi";
import { 执行全局速率结算 } from '@/core/jie_suan_yin_qing.js';
import { 引擎信号 } from "./quan_ju_xin_hao.js";
import { use计算机系统 } from "../features/ji_suan_ji_xi_tong";
import { use手动生产 } from '@/features/sheng_chan_xi_tong';
import { 执行航行推演, 执行港口吞吐 } from '@/features/wu_liu_xi_tong/composables/wu_liu_guan_li.js';
// =================游戏核心函数=================


function 推进库存自然增长(固定步长秒) {
    const 库存 = use库存();
    const 全局速率 = use全局速率();
    const 计算机 = use计算机系统();

    // 1. 外层遍历所有殖民地
    for (const colonyId in 全局速率.数据) {
        const 殖民地速率表 = 全局速率.数据[colonyId];

        // 2. 内层遍历该殖民地下的物品
        for (const id in 殖民地速率表) {
            const 净值速率 = 殖民地速率表[id].净值;
            if (净值速率 === 0) continue;

            // ⚠️ 传入 colonyId 获取当地库存
            const 当前库存 = 库存.查询库存(id, colonyId);
            const 增加量 = 净值速率 * 固定步长秒;
            let 预计库存 = 当前库存 + 增加量;

            // ⚠️ 传入 colonyId 获取当地硬盘/云端上限
            const 硬盘上限 = 计算机.获取物品库存上限(id, colonyId);
            if (预计库存 > 硬盘上限) 预计库存 = 硬盘上限;

            if (预计库存 < 0) 预计库存 = 0;

            // 判断跨越 0 边界，打上脏标记
            if ((预计库存 === 0 && 当前库存 > 0) || (预计库存 > 0 && 当前库存 <= 0)) {
                引擎信号.需要重新结算 = true;
            }

            // ⚠️ 传入 colonyId 覆盖当地库存
            库存.覆盖库存(id, 预计库存, colonyId);
        }
    }
}

let 上次时间 = Date.now();
let 累加器 = 0; // 这就是我们的“时间蓄水池”
const 固定步长秒 = 0.1; // 固定为 100ms (即 10 TPS)。

let 动画帧ID = null;

export function 启动游戏循环() {
    const 科技系统 = use科技系统()
    const 游戏控制 = use游戏控制()
    const { 逻辑更新: 手动生产更新 } = use手动生产();

    if (动画帧ID !== null) {
        cancelAnimationFrame(动画帧ID);
    }

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
        if (!游戏控制.暂停) {
            累加器 += 真实流逝秒数;

            // 4. 只要池子里的时间够 0.1 秒，就执行一次逻辑计算
            while (累加器 >= 固定步长秒) {
                // ================= 逻辑帧开始 =================
                科技系统.推进实际科研进度(固定步长秒);

                推进库存自然增长(固定步长秒)

                手动生产更新(固定步长秒);

                执行航行推演(固定步长秒);
                执行港口吞吐(固定步长秒);
                // ================= 逻辑帧结束 =================

                累加器 -= 固定步长秒;
            }
        }
        if (引擎信号.需要重新结算) {
            执行全局速率结算();
            引擎信号.需要重新结算 = false;
        }

        动画帧ID = requestAnimationFrame(loop);
    }
    loop();

}

