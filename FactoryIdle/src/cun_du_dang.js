// src/cun_du_dang.js
import { use库存 } from '@/stores/ku_cun.js';
import { use配方分配 } from '@/stores/pei_fang_fen_pei.js';
import { use科技系统 } from '@/stores/ke_ji_xi_tong.js'
import { 引擎信号 } from '@/systems/quan_ju_xin_hao';
import { use计算机系统 } from '@/stores/ji_suan_ji_xi_tong.js';
import { use游戏设置 } from '@/stores/she_zhi.js';

/**
 * 手动存档逻辑
 * @returns {boolean} 是否存档成功
 */
export const 存档 = () => {
    try {
        const 配方分配 = use配方分配();
        const 科技系统 = use科技系统();
        const 库存 = use库存();
        const 计算机系统 = use计算机系统();
        const 游戏设置 = use游戏设置();

        const data = {
            库存: 库存.数据,
            配方分配: 配方分配.数据,
            科技系统: 科技系统.$state,
            计算机系统: 计算机系统.$state,
            游戏设置: 游戏设置.$state,
            存档时间: Date.now() // 记录存档时间，方便展示
        };

        localStorage.setItem('存档字符串', JSON.stringify(data));
        console.log('游戏进度已保存');
        return true;
    } catch (error) {
        console.error('存档失败:', error);
        return false;
    }
};

/**
 * 读档逻辑
 * @returns {boolean} 是否读档成功
 */
export const 读档 = () => {
    try {
        const 存档文件 = localStorage.getItem('存档字符串');
        if (!存档文件) return false;

        const 存档对象 = JSON.parse(存档文件);
        const 科技系统 = use科技系统();
        const 配方分配 = use配方分配();
        const 库存 = use库存();
        const 计算机系统 = use计算机系统();
        const 游戏设置 = use游戏设置();

        //恢复库存数据
        if (存档对象.库存) {
            Object.assign(库存.数据, 存档对象.库存);
        }

        //恢复配方分配方案
        if (存档对象.配方分配) {
            // 先清空当前内存中的分配，再合并
            Object.assign(配方分配.数据, 存档对象.配方分配);
        }

        //恢复科技进度
        if (存档对象.科技系统) {
            Object.assign(科技系统.$state, 存档对象.科技系统);
        }

        //恢复计算机硬件配置
        if (存档对象.计算机系统) {
            Object.assign(计算机系统.$state, 存档对象.计算机系统);
        }

        if (存档对象.游戏设置) {
            Object.assign(游戏设置.$state, 存档对象.游戏设置); // 4. 载入
        }

        // 5. 触发全局引擎重新结算
        引擎信号.需要重新结算 = true;

        console.log('游戏进度已载入');
        return true;
    } catch (error) {
        console.error('读档失败:', error);
        return false;
    }
};

/**
 * 清除存档逻辑
 */
export const 删除存档 = () => {
    localStorage.removeItem('存档字符串');
    console.warn('存档已从本地存储中抹除');
    // 注意：清除后通常需要页面重载来重置 Pinia Stores
};

/**
 * 自动存档功能 (保持每 60 秒运行一次)
 */
export const 启动自动存档 = () => {
    setInterval(() => {
        存档();
        console.log('自动存档已完成');
    }, 60000);
};