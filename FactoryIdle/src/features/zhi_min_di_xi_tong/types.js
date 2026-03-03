/**
 * @typedef {Object} EnvironmentConfig
 * @property {number} 太阳能强度
 * @property {number} 风力等级
 */

/**
 * @typedef {Object} ColonyConfig
 * @property {string} id
 * @property {string} 名称
 * @property {EnvironmentConfig} 环境
 * @property {Object<string, number>} 资源丰度 - Key为物品ID，Value为产量倍率
 */
export default {};