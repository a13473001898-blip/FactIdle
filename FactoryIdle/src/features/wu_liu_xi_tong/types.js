// src/features/wu_liu_xi_tong/types.js

/**
 * 航线节点中的单次装卸操作指令
 * @typedef {Object} TransferAction
 * @property {('装载'|'卸载')} 动作
 * @property {string} 物品id
 * @property {number|'全部'} 目标数量 - 期望装卸的具体数值，或者 '全部'
 */

/**
 * 单个航线节点
 * @typedef {Object} RouteNode
 * @property {string} 节点星系CID
 * @property {('按次序执行即走'|'等待装满'|'等待清空')} 停靠规则
 * @property {TransferAction[]} 操作列表
 */

/**
 * 单艘飞船的完整数据结构 (真正的飞行机箱)
 * @typedef {Object} SpaceShip
 * @property {string} id - 飞船唯一ID (ship_xxx) (🌟 已修正为 id)
 * @property {string} 名称 - 玩家自定义名称
 * @property {('停泊中'|'航行中'|'装卸中'|'排队中')} 当前状态
 * @property {string|null} 当前位置 - 停泊时的星系CID，航行时为出发地CID
 * @property {string|null} 目标位置 - 航行时的目的地CID
 * @property {number} 航行进度 - 0~100 的百分比
 * * // --- 硬件插槽 ---
 * @property {string|null} 装备的船体 - 类似主板，决定槽位上限
 * @property {string[]} 装备的引擎 - 决定速度
 * @property {string[]} 装备的硬盘 - 决定载货量 
 * @property {string[]} 装备的网卡 - 决定港口装卸带宽
 * @property {string[]} 装备的辅助 - 决定航线复杂度及其他加成
 * * // --- 内部状态 ---
 * @property {Object<string, number>} 载货清单 - 硬盘里实际装载的物资字典 (🌟 改名更贴切)
 */

export default {};