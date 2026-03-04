// src/features/ji_suan_ji_xi_tong/types.js

/**
 * 物理机箱的数据结构
 * @typedef {Object} ComputerChassis
 * @property {string|null} 装备的主板 - 当前挂载的主板ID
 * @property {string[]} 装备的CPU - 挂载的CPUID列表
 * @property {string[]} 装备的内存 - 挂载的内存ID列表
 * @property {string[]} 装备的硬盘 - 挂载的硬盘ID列表
 * @property {string[]} 装备的网卡 - 挂载的网卡ID列表
 * @property {Object<string, number>} 保底配额表 - Key为物品ID，Value为保底空间(数量，非字节)
 * @property {number} 云端配额 - 划拨给全网云端的物体存储字节数
 */

export default {};