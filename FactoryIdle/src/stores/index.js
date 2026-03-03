// src/stores/index.js
import { use库存 } from './ku_cun.js';
import { use配方分配 } from './pei_fang_fen_pei.js';
import { use科技系统 } from './ke_ji_xi_tong.js';
import { use计算机系统 } from './ji_suan_ji_xi_tong.js';
import { use游戏设置 } from './she_zhi.js';
import { use殖民地系统 } from './zhi_min_di_xi_tong.js';
import { use能源模块 } from './neng_yuan_xi_tong.js';
import { use全局速率 } from './su_lv.js';
import { use生产线系统 } from './sheng_chan_xian_xi_tong.js';

// 获取所有核心业务 Store 的实例列表
export const 获取所有核心Stores = () => [
    { name: 'ku_cun', store: use库存() },
    { name: 'pei_fang', store: use配方分配() },
    { name: 'ke_ji', store: use科技系统() },
    { name: 'ji_suan_ji', store: use计算机系统() },
    { name: 'she_zhi', store: use游戏设置() },
    { name: 'zhi_min_di', store: use殖民地系统() },
    { name: 'neng_yuan', store: use能源模块() },
    { name: 'su_lv', store: use全局速率() },
    { name: 'sheng_chan_xian', store: use生产线系统() },
];

// ================= 全局生命周期统筹 =================

/** 触发全网新星系初始化 */
export const 全局_初始化新殖民地 = (cid) => {
    获取所有核心Stores().forEach(({ store }) => {
        // 只要这个 store 实现了 初始化新殖民地 方法，就自动调用它
        if (typeof store.初始化新殖民地 === 'function') {
            store.初始化新殖民地(cid);
        }
    });
};

/** 统筹导出所有存档数据 */
export const 全局_导出所有存档 = () => {
    const data = {};
    获取所有核心Stores().forEach(({ name, store }) => {
        if (typeof store.导出数据 === 'function') {
            data[name] = store.导出数据();
        }
    });
    return data;
};

/** 统筹导入所有存档数据 */
export const 全局_导入所有存档 = (存档对象, 版本号) => {
    获取所有核心Stores().forEach(({ name, store }) => {
        if (typeof store.导入数据 === 'function') {
            store.导入数据(存档对象[name], 版本号);
        }
    });
};