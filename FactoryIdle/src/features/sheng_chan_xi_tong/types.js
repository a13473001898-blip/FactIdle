// src/features/sheng_chan_xi_tong/types.js

/**
 * 机器运行状态
 * @typedef {('运行'|'停止')} MachineStatus
 */

/**
 * 单个建筑/机器的分配数据
 * @typedef {Object} MachineAllocation
 * @property {number} 数量 - 分配给该配方的机器数量
 * @property {MachineStatus} 状态 - 当前机器的工作状态
 */

/**
 * 生产线元数据
 * @typedef {Object} ProductionLineMeta
 * @property {string} id - 生产线唯一ID (如 line_xxx)
 * @property {string} 名称 - 生产线自定义名称
 * @property {[]} 目标物品ID列表 - 用于UI追溯的最终产物
 * @property {number} 绑定核心索引 - 挂载的物理CPU核心编号
 * @property {MachineStatus} 状态 - 生产线的总开关状态
 */

export default {};