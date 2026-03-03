// src/shared/types.js

/**
 * @typedef {('资源'|'原材料'|'零部件'|'高级零部件'|'建筑'|'科技包'|'能源'|'计算机硬件'|'流体')} ItemCategory 物品分类
 * @typedef {('采集'|'熔炼'|'制造'|'研究'|'烧水')} RecipeCategory 配方/建筑分类
 * @typedef {('热能'|'蒸汽'|'电力'|'无')} EnergyType 能源类型
 * @typedef {('物体'|'能源'|'流体')} StorageCategory 存储类别
 */

/**
 * 物品基础数据结构 (对应 pei_zhi_shu_ju 中的物品配置)
 * @typedef {Object} ItemData
 * @property {string} id - 物品唯一标识
 * @property {string} 名称 - 物品本地化名称
 * @property {ItemCategory} 类型 - 物品大类
 * @property {number} [字节] - 占用存储空间或算力空间 (可选)
 * @property {boolean} [燃料] - 是否可作为燃料 (可选)
 * @property {number} [热值] - 燃料提供的热值 (可选)
 * @property {string} [平台] - 硬件所属平台，如 '蒸汽' (可选)
 * @property {number} [CPU槽位] - 主板提供的CPU插槽数 (可选)
 * @property {number} [内存槽位] - 主板提供的内存插槽数 (可选)
 * @property {number} [硬盘槽位] - 主板提供的硬盘插槽数 (可选)
 * @property {number} [核心数] - CPU提供的核心数量 (可选)
 * @property {number} [频率] - CPU单核频率上限 (可选)
 * @property {number} [提供内存] - 内存条提供的容量 (可选)
 * @property {number} [提供容量] - 硬盘提供的容量 (可选)
 * @property {StorageCategory} [存储类别] - 硬盘存储的分类 (可选)
 */

/**
 * 输入/输出物品组
 * @typedef {Object} ItemAmount
 * @property {string} id - 物品ID
 * @property {number} 数量 - 数量
 */

/**
 * 配方数据结构
 * @typedef {Object} RecipeData
 * @property {string} id - 配方唯一标识
 * @property {RecipeCategory} 类型 - 配方加工类型
 * @property {ItemAmount[]} 输入 - 需要消耗的原料列表
 * @property {ItemAmount[]} 输出 - 产出的物品列表
 * @property {number} 时间 - 基础加工耗时(秒)
 */

/**
 * 建筑/机器数据结构
 * @typedef {Object} MachineData
 * @property {string} id - 建筑对应的物品ID
 * @property {RecipeCategory} 类型 - 建筑对应的工作类型
 * @property {number} 速度 - 基础加工速度倍率
 * @property {EnergyType} 能源类型 - 消耗的能源种类
 * @property {number} 能耗 - 每秒消耗的能源数量或功率
 */

/**
 * 殖民地/星系基础配置
 * @typedef {Object} ColonyConfig
 * @property {string} id - 殖民地唯一标识
 * @property {string} 名称 - 殖民地名称
 * @property {{ 太阳能强度: number, 风力等级: number }} 环境 - 环境系数
 * @property {Record<string, number>} 资源丰度 - 矿物ID对应的产量倍率 (如: {'tie_kuang': 1.5})
 */

/**
 * 结算速率通用数据结构 (对应速率模板)
 * @typedef {Object} RateData
 * @property {number} 产出 - 实际每秒产出
 * @property {number} 消耗 - 实际每秒消耗
 * @property {number} 需求 - 理论每秒需求
 * @property {number} 净值 - 最终净速率 (产出 - 消耗)
 * @property {number} [理论需求] - 满载时的需求
 * @property {number} [理论产出] - 满载时的产出
 */

export default {}; // 确保这是一个模块文件