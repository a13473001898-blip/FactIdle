// src/features/settings/store.js
import { defineStore } from 'pinia';

/** * 导入类型以供 JSDoc 使用
 * @typedef {import('./types').ThresholdConfig} ThresholdConfig
 * @typedef {import('./types').DisplayConfig} DisplayConfig
 */

export const use游戏设置 = defineStore('you_xi_she_zhi', {
    state: () => ({
        /** @type {ThresholdConfig} */
        阈值配置: {
            '内存红色报警': 0.9,
            '内存黄色预警': 0.7,
            '硬盘红色报警': 0.95,
            '硬盘黄色预警': 0.8,
            '能源断供报警': 0.98,
            '能源高负载预警': 0.85
        },
        /** @type {DisplayConfig} */
        显示配置: {
            数字模式: 'standard',
            保留小数: 2,
            主题模式: 'auto',
            高对比度: false
        },
        /** @type {number} */
        自动存档间隔: 60
    }),
    actions: {
        /**
         * 通用修改接口
         * @param {keyof ThresholdConfig} key 阈值名称
         * @param {number} value 新的百分比值 (0-1)
         */
        修改阈值(key, value) {
            if (this.阈值配置[key] !== undefined) {
                this.阈值配置[key] = value;
            }
        },
        
        /**
         * 更新显示设置
         * @template {keyof DisplayConfig} K
         * @param {K} key
         * @param {DisplayConfig[K]} value
         */
        更新显示设置(key, value) {
            this.显示配置[key] = value;
        },

        // ================= 存档接口 =================
        导出数据() {
            return this.$state;
        },
        导入数据(存档数据, 版本号) {
            if (存档数据) this.$patch(存档数据);
        }
    }
});