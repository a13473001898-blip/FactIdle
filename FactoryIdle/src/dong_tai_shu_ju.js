import { reactive,computed,toRefs } from "vue";

import { 获取建筑数据,获取所有物品列表,获取配方数据 } from './pei_zhi_shu_ju.js';

export const 游戏数据 = reactive({
    库存:{
        kuang_ji : 0,
        zu_zhuang_ji : 0
    },

    配方分配 : {

    },

    速率 : {
        
    }
})


//  =================工厂函数=================

function 库存数据模板() {
    //占位符
}

function 配方分配数据模板() {
    return {
        数量 : 0,
        状态 : '运行', //默认状态为运行
    }
}

function 速率数据模板() {
    return {
        产出: 0, 
        消耗: 0, 
        净值: 0,
    }
}


//  =================库存数据操作=================


/**
 * 
 * @param {*} id 指定要查询的物品 
 * @returns 返回物品的数量,只读
 */
export function 查询库存(id) {
    return 游戏数据.库存[id] || 0
}

export function 库存增加(id,数量,倍率=1) {
    if(数量 < 0) return
    if(!游戏数据.库存[id]) 游戏数据.库存[id] = 0

    //库存上限判断

    游戏数据.库存[id] += 数量 * 倍率
}

export function 库存减少(id,数量,倍率=1) {
    if(数量 < 0) return false
    if(!游戏数据.库存[id]) 游戏数据.库存[id] = 0

    if(游戏数据.库存[id] < 数量) return false
    游戏数据.库存[id] -= 数量 * 倍率
    return true
}

export function 库存检查(输入数组,倍率=1) {
    if(!输入数组 || 输入数组.length === 0 ) return true
    for(const 输入 of 输入数组 ) {
        const 库存物品 = 游戏数据.库存[输入.id] || 0
        if( 库存物品 < 输入.数量 * 倍率) return false
    }
    return true
}


// =================配方分配数据操作=================


export function 初始化配方分配数据(配方id,建筑id) {
    if (!游戏数据.配方分配[配方id]) {
        游戏数据.配方分配[配方id] = {}
    }
    if (!游戏数据.配方分配[配方id][建筑id]) {
        游戏数据.配方分配[配方id][建筑id] = 配方分配数据模板()
    }
}

/**
 * 
 * @param {*} 配方id 必传
 * @param {*} 建筑id 可选,如果没有则返回配方id对应的对象
 * @returns 如果有建筑id返回对应的数量
 */
export function 查询配方分配(配方id,建筑id) {
    const 配方数据 = 游戏数据.配方分配[配方id]
    if (!建筑id) return 配方数据 || {}
    return 配方数据?.[建筑id]?.数量 || 0
}

export const 增加配方分配建筑数量 = (配方id, 建筑id, 数量) => {
    if (!库存减少(建筑id,数量)) return;

    初始化配方分配数据(配方id,建筑id)
    游戏数据.配方分配[配方id][建筑id].数量 += 数量
    
}

export function 减少配方分配建筑数量 (配方id,建筑id,数量) {
    if (查询配方分配(配方id,建筑id) < 数量) return;
    游戏数据.配方分配[配方id][建筑id].数量 -= 数量

    库存增加(建筑id,数量)

    if (游戏数据.配方分配[配方id][建筑id].数量 <= 0) {
    delete 游戏数据.配方分配[配方id][建筑id];
    }
}


// =================速率数据操作=================


export function 查询速率(物品id,属性) {
    const 速率数据 = 游戏数据.速率[物品id] || 速率数据模板()
    if(!属性) return 速率数据
    return 速率数据[属性]  || 0
}


// =================游戏核心函数=================


/**
 * 通用生产函数
 * @param {string} 配方ID - 要执行的配方ID
 * @param {number} 倍率 - (可选) 生产倍数，默认为 1
 * @returns {object} - 返回结果 { success: boolean, msg: string }
 */
export function 执行配方生产(配方ID, 倍率 = 1) {
    const 配方 = 获取配方数据(配方ID);
    if (!配方) return { success: false, msg: '配方不存在' };

    // --- 第一阶段：检查原料 (Check Phase) ---
    if ( !库存检查(配方.输入) ) {
        return { success: false, msg: `${原料.id} 原料不足` };
    }

    // --- 第二阶段：执行扣除 (Deduct Phase) ---
    for (const 原料 of 配方.输入) {
        库存减少(原料.id, 原料.数量*倍率)
    }

    // --- 第三阶段：执行产出 (Add Phase) ---
    for (const 产物 of 配方.输出) {
        库存增加(产物.id, 产物.数量*倍率)
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
    for (const key in 获取所有物品列表()) {
        临时速率表[key] = { 产出: 0, 消耗: 0, 净值: 0 };
    }

    // 2. 遍历“配方分配” (核心逻辑)
    // 结构参考: 游戏数据.配方分配[配方ID][建筑ID] = 数量
    for (const 配方ID in 游戏数据.配方分配) {
        const 分配情况 = 游戏数据.配方分配[配方ID];
        const 当前配方 = 获取配方数据(配方ID);

        // 2.1 算出这个配方下的“总生产力” (总建筑速度)
        let 总建筑速度 = 0;
        for (const 建筑ID in 分配情况) {
            if (分配情况[建筑ID].状态 !== '运行') continue

            const 数量 = 分配情况[建筑ID].数量;
            const 单个速度 = 获取建筑数据(建筑ID)?.速度 || 0;
            
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
                const 预计库存 = 游戏数据.库存[id] + 增加量

                if (预计库存 < 0 ) {
                    游戏数据.库存[id] = 0
                } else {
                    游戏数据.库存[id] = 预计库存
                }
            }
        }

        上次时间 = 现在时间;
        requestAnimationFrame(loop);
    };

    // 第一次启动
    loop();
}