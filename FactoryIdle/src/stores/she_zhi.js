// src/stores/she_zhi.js
import { defineStore } from 'pinia';

export const use游戏设置 = defineStore('you_xi_she_zhi', {
    state: () => ({
        // 阈值配置：Key 建议使用中文或易懂的 ID
        // 所有的值均为 0 到 1 之间的浮点数 (百分比)
        阈值配置: {
            '内存红色报警': 0.9,
            '内存黄色预警': 0.7,
            '硬盘红色报警': 0.95,
            '硬盘黄色预警': 0.8,
            '能源断供报警': 0.98,
            '能源高负载预警': 0.85
        },
        显示配置: {
            数字模式: 'standard', // 'standard' (K/M/B), 'scientific' (1.2e9), 'engineering' (120e6)
            保留小数: 2,
            主题模式: 'auto',     // 'light', 'dark', 'auto'
            高对比度: false
        },
        自动存档间隔: 60
    }),
    actions: {
        /**
         * 通用修改接口
         * @param {string} key 阈值名称
         * @param {number} value 新的百分比值 (0-1)
         */
        修改阈值(key, value) {
            if (this.阈值配置[key] !== undefined) {
                this.阈值配置[key] = value;
            }
        },
        更新显示设置(key, value) {
            this.显示配置[key] = value;
        },
    }
});