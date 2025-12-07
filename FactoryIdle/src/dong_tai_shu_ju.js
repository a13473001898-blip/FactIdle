import { reactive,computed,toRefs } from "vue";

import { 建筑 as 建筑配置, 物品 as 物品配置, 配方 as 配方配置 } from './pei_zhi_shu_ju.js';

export const 游戏数据 = reactive({
    库存:{

    },

    配方分配 : {
        tie_ban_r : {
        }
    },

    速率 : {
        tie_kuang : {产出: 1010,消耗: 0,净值: 100},
        tie_ban : {产出: 5,消耗: 0,净值: 0},
        mei_tan : {产出: 1,消耗: 0,净值: 0},
    }
})


/**
 * 通用生产函数
 * @param {string} 配方ID - 要执行的配方ID
 * @param {number} 倍率 - (可选) 生产倍数，默认为 1
 * @returns {object} - 返回结果 { success: boolean, msg: string }
 */
export function 执行配方生产(配方ID, 倍率 = 1) {
    const 配方 = 配方配置[配方ID];
    
    // 1. 安全检查
    if (!配方) return { success: false, msg: '配方不存在' };

    // --- 第一阶段：检查原料 (Check Phase) ---
    for (const 原料 of 配方.输入) {
        const 需要数量 = 原料.数量 * 倍率;

        const 当前库存 = 游戏数据.库存[原料.id] || 0; 

        if ( 当前库存 < 需要数量 ) {
            return { success: false, msg: `${原料.id} 原料不足` };
        }
    }

    // --- 第二阶段：执行扣除 (Deduct Phase) ---
    for (const 原料 of 配方.输入) {
        const 消耗数量 = 原料.数量 * 倍率;
        
        游戏数据.库存[原料.id] -= 消耗数量;
    }

    // --- 第三阶段：执行产出 (Add Phase) ---
    for (const 产物 of 配方.输出) {
        const 产出数量 = 产物.数量 * 倍率;
        
        // 初始化一下，防止报错
        if (!游戏数据.库存[产物.id]) 游戏数据.库存[产物.id] = 0;
        
        游戏数据.库存[产物.id] += 产出数量;
    }

    return { success: true, msg: '生产成功' };
}

/**
 * 核心函数：遍历所有配方分配，重新计算每个物品的 产出/消耗/净值
 * 并将结果写入 游戏数据.速率
 */
export function 更新全局速率() {
    // 1. 准备一张“白纸”
    // 用一个临时对象来统计，避免在计算过程中 UI 频繁跳动
    const 临时速率表 = {};

    // 预填所有物品，防止 UI 读到 undefined 报错
    for (const key in 物品配置) {
        临时速率表[key] = { 产出: 0, 消耗: 0, 净值: 0 };
    }

    // 2. 遍历“配方分配” (核心逻辑)
    // 结构参考: 游戏数据.配方分配[配方ID][建筑ID] = 数量
    for (const 配方ID in 游戏数据.配方分配) {
        const 分配情况 = 游戏数据.配方分配[配方ID];
        const 当前配方 = 配方配置[配方ID];

        // 2.1 算出这个配方下的“总生产力” (总建筑速度)
        let 总建筑速度 = 0;
        for (const 建筑ID in 分配情况) {
            const 数量 = 分配情况[建筑ID];
            const 单个速度 = 建筑配置[建筑ID].速度;
            
            // TODO: 请写出计算公式
            // 总建筑速度 += ???
             总建筑速度 += 数量 * 单个速度;
        }

        // 2.2 算出“每秒执行次数” (批次)
        // 公式：总速度 / 配方时间
        // 注意：防止除以 0
        if (当前配方.时间 === 0) continue; 
        const 每秒批次 = 总建筑速度 / 当前配方.时间;

        // 2.3 结算消耗 (输入)
        for (const 原料 of 当前配方.输入) {
             // TODO: 算出每秒消耗多少个原料，并加到临时表的“消耗”字段里
             // 数量 = 每秒批次 * 原料.数量
             临时速率表[原料.id].消耗 += 每秒批次 * 原料.数量;
        }

        // 2.4 结算产出 (输出)
        for (const 产物 of 当前配方.输出) {
             // TODO: 算出每秒产出多少个产物，并加到临时表的“产出”字段里
             临时速率表[产物.id].产出 += 每秒批次 * 产物.数量;
        }
    }

    // 3. 计算净值并写入全局数据
    for (const key in 临时速率表) {
        const item = 临时速率表[key];
        item.净值 = item.产出 - item.消耗;
        
        // 最后一步：覆盖回响应式数据
        游戏数据.速率[key] = item;
    }
    
    console.log("速率已更新", 游戏数据.速率);
}

let 上次时间 = Date.now();

export function 启动游戏循环() {
    
    const loop = () => {
        const 现在时间 = Date.now();
        const 过去的时间秒 = 现在时间 /1000 - 上次时间 / 1000

        if (现在时间 > 上次时间) {
            for (const id in 游戏数据.速率) {
                
                const 净值速率 = 游戏数据.速率[id].净值
                if (净值速率 === 0) continue;

                const 增加量 = 净值速率 * 过去的时间秒

                if (游戏数据.库存[id] === undefined) {
                    游戏数据.库存[id] = 0;
                }
                游戏数据.库存[id] += 增加量
            }
        }

        上次时间 = 现在时间;
        requestAnimationFrame(loop);
    };

    // 第一次启动
    loop();
}