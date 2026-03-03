// src/features/neng_yuan_xi_tong/types.js

/**
 * 单种能源的实时状态数据
 * @typedef {Object} EnergyData
 * @property {number} 产出 - 每秒总产出
 * @property {number} 需求 - 每秒总需求
 * @property {number} 净值 - 产出减去消耗的净值
 * @property {number} 满足率 - 0~1之间，代表需求被满足的程度
 * @property {number} 负载率 - 代表产出被占用的比例
 */

/**
 * 星球级别的能源账单字典 (Key为物品ID，Value为账单详情)
 * @typedef {Object<string, { 产出: number, 消耗: number, 需求: number, 净值: number }>} EnergyBill
 */

export default {};