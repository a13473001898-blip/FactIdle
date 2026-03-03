// src/stores/index.js
import { use库存 } from '@/features/wu_pin_xi_tong';
import { use配方分配 } from '@/features/sheng_chan_xi_tong';
import { use科技系统 } from '@/features/ke_ji_xi_tong';
import { use计算机系统 } from '../features/ji_suan_ji_xi_tong';
import { use殖民地系统 } from '../features/zhi_min_di_xi_tong';
import { use能源模块 } from '../features/neng_yuan_xi_tong';
import { use全局速率 } from '../features/su_lv_xi_tong';
import { use生产线系统 } from '@/features/sheng_chan_xi_tong';
import { use游戏设置 } from '@/features/she_zhi_xi_tong';

// 获取所有核心业务 Store 的实例列表
export const 获取所有核心Stores = () => [
    { name: 'ku_cun', store: use库存() },
    { name: 'pei_fang', store: use配方分配() },
    { name: 'ke_ji', store: use科技系统() },
    { name: 'ji_suan_ji', store: use计算机系统() },
    { name: 'zhi_min_di', store: use殖民地系统() },
    { name: 'neng_yuan', store: use能源模块() },
    { name: 'su_lv', store: use全局速率() },
    { name: 'sheng_chan_xian', store: use生产线系统() },
    { name: 'she_zhi', store: use游戏设置() },
];

// ================= 全局生命周期统筹 =================

/** 触发全网新星系初始化 */
export const 全局_初始化新殖民地 = (cid) => {
    获取所有核心Stores().forEach(({ store }) => {
        const s = /** @type {any} */ (store);
        // 只要这个 store 实现了 初始化新殖民地 方法，就自动调用它
        if (typeof s.初始化新殖民地 === 'function') {
            s.初始化新殖民地(cid);
        }
    });
};

/** 统筹导出所有存档数据 */
export const 全局_导出所有存档 = () => {
    const data = {};
    获取所有核心Stores().forEach(({ name, store }) => {
        const s = /** @type {any} */ (store);
        if (typeof s.导出数据 === 'function') {
            data[name] = s.导出数据();
        }
    });
    return data;
};

/** 统筹导入所有存档数据 */
export const 全局_导入所有存档 = (存档对象, 版本号) => {
    获取所有核心Stores().forEach(({ name, store }) => {
        const s = /** @type {any} */ (store);
        if (typeof s.导入数据 === 'function') {
            s.导入数据(存档对象[name], 版本号);
        }
    });
};