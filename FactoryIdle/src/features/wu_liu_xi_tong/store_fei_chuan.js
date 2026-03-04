// src/features/wu_liu_xi_tong/store_fei_chuan.js
import { defineStore } from 'pinia';
import { 引擎信号 } from '@/core/quan_ju_xin_hao.js';
import { 获取物品数据 } from '@/shared/pei_zhi_shu_ju.js';

/** @typedef {import('./types').SpaceShip} SpaceShip */

/**
 * @param {string} id 
 * @param {string} 名称 
 * @param {string} 初始位置CID 
 * @returns {SpaceShip} 🌟 解决 TS 类型推导报错
 */
function 飞船数据模板(id, 名称, 初始位置CID) {
    return /** @type {SpaceShip} */ ({
        id,
        名称,
        当前状态: '停泊中',
        当前位置: 初始位置CID,
        目标位置: null,
        航行进度: 0,

        装备的船体: null,
        装备的引擎: [],
        装备的硬盘: [],
        装备的网卡: [],
        装备的辅助: [],

        载货清单: {}
    });
}

export const use飞船实体系统 = defineStore('fei_chuan_shi_ti_xi_tong', {
    state: () => ({
        /** * 全局舰队实体库 (Key为飞船ID，Value为飞船对象)
         * @type {Object<string, SpaceShip>} 
         */
        舰队库: {},
        飞船序列号: 0
    }),

    getters: {
        停泊中的飞船: (state) => (cid) => {
            return Object.values(state.舰队库).filter(
                ship => ship.当前位置 === cid && (ship.当前状态 === '停泊中' || ship.当前状态 === '装卸中' || ship.当前状态 === '排队中')
            );
        },
        获取飞船: (state) => (shipId) => {
            return state.舰队库[shipId] || null;
        },

        // ================= 🌟 物理与性能计算 Getters =================

        // 1. 最大容量：计算所有挂载硬盘的提供容量之和
        获取飞船最大容量: (state) => (shipId) => {
            const ship = state.舰队库[shipId];
            if (!ship) return 0;
            return ship.装备的硬盘.reduce((总和, 硬盘id) => {
                return 总和 + (获取物品数据(硬盘id)?.提供容量 || 0);
            }, 0);
        },

        // 2. 已载质量：计算货舱内所有物品的总体积/质量
        获取飞船已载质量: (state) => (shipId) => {
            const ship = state.舰队库[shipId];
            if (!ship) return 0;
            let 总质量 = 0;
            for (const [物品id, 数量] of Object.entries(ship.载货清单)) {
                总质量 += 数量 * (获取物品数据(物品id)?.字节 || 1);
            }
            return 总质量;
        },

        // 3. 飞船总质量：船体基础质量 + 货物总质量 (决定航速衰减)
        获取飞船总质量(state) {
            return (shipId) => {
                const ship = state.舰队库[shipId];
                if (!ship || !ship.装备的船体) return 0;

                const 船体质量 = 获取物品数据(ship.装备的船体)?.基础质量 || 0;

                // ✅ 现在可以通过 this 访问其他 Getter
                return 船体质量 + this.获取飞船已载质量(shipId);
            };
        },

        // 4. 总推力：计算所有挂载引擎的推力之和
        获取飞船总推力: (state) => (shipId) => {
            const ship = state.舰队库[shipId];
            if (!ship) return 0;
            return ship.装备的引擎.reduce((总和, 引擎id) => {
                return 总和 + (获取物品数据(引擎id)?.推力 || 0);
            }, 0);
        },

        // 5. 网卡带宽：查询装备的网卡传输速率 (用于限制港口装卸极速)
        获取飞船网卡带宽: (state) => (shipId) => {
            const ship = state.舰队库[shipId];
            if (!ship) return 0;
            if (ship.装备的网卡.length === 0) return 10; // 没网卡的龟速保底（比如靠人工搬运）

            // 假设一艘船只允许发挥一张网卡的最高带宽
            let 最大带宽 = 0;
            for (const 网卡id of ship.装备的网卡) {
                const 带宽 = 获取物品数据(网卡id)?.传输带宽 || 0;
                if (带宽 > 最大带宽) 最大带宽 = 带宽;
            }
            return 最大带宽;
        },
        获取飞船槽位限制: (state) => (shipId) => {
            const ship = state.舰队库[shipId];
            if (!ship || !ship.装备的船体) return { 引擎: 0, 硬盘: 0, 网卡: 0, 辅助: 0 };

            const 船体数据 = 获取物品数据(ship.装备的船体);
            return {
                引擎: 船体数据?.引擎槽位 || 0,
                硬盘: 船体数据?.硬盘槽位 || 0,
                网卡: 船体数据?.网卡槽位 || 0,
                辅助: 船体数据?.辅助槽位 || 0
            };
        },

        /**
         * 🌟 新增：计算飞船当前的导航系统上限
         * 逻辑：遍历所有辅助模块，以其中“最大航线节点”最高的一个为准
         */
        获取飞船导航能力: (state) => (shipId) => {
            const ship = state.舰队库[shipId];
            if (!ship) return 0;
            // 如果连船体都没安装，导航能力为 0
            if (!ship.装备的船体) return 0;

            let maxNodes = 0;
            for (const id of ship.装备的辅助) {
                const data = 获取物品数据(id);
                // 查询配置数据中的“最大航线节点”属性
                if (data?.最大航线节点 && data.最大航线节点 > maxNodes) {
                    maxNodes = data.最大航线节点;
                }
            }
            return maxNodes;
        },
    },

    actions: {
        // ================= 飞船生命周期 =================
        _创建飞船(cid, 名称) {
            this.飞船序列号++;
            const shipId = 'ship_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
            const 最终名称 = 名称 || `飞船${this.飞船序列号}`;
            this.舰队库[shipId] = 飞船数据模板(shipId, 最终名称, cid);
            引擎信号.需要重新结算 = true;
            return shipId;
        },

        // 🌟 新增：修改飞船名称
        _修改飞船名称(shipId, 新名称) {
            if (this.舰队库[shipId] && 新名称) {
                this.舰队库[shipId].名称 = 新名称;
                // 触发信号让相关 UI 同步刷新
                引擎信号.需要重新结算 = true;
            }
        },

        _解体飞船(shipId) {
            if (this.舰队库[shipId]) {
                delete this.舰队库[shipId];
                引擎信号.需要重新结算 = true;
            }
        },

        // ================= 硬件插槽操作 =================
        _安装船体(shipId, 物品id) {
            if (this.舰队库[shipId]) this.舰队库[shipId].装备的船体 = 物品id;
            引擎信号.需要重新结算 = true;
        },
        _卸载船体(shipId) {
            if (this.舰队库[shipId]) this.舰队库[shipId].装备的船体 = null;
            引擎信号.需要重新结算 = true;
        },
        _安装模块(shipId, 模块类型, 物品id) {
            const ship = this.舰队库[shipId];
            if (!ship) return false;

            // 🌟 核心修改：增加内部溢出校验
            const 映射表 = {
                '装备的引擎': '引擎',
                '装备的硬盘': '硬盘',
                '装备的网卡': '网卡',
                '装备的辅助': '辅助'
            };
            const 槽位类型 = 映射表[模块类型];
            const 限制 = this.获取飞船槽位限制(shipId)[槽位类型];

            if (ship[模块类型] && ship[模块类型].length < 限制) {
                ship[模块类型].push(物品id);
                引擎信号.需要重新结算 = true;
                return true;
            }
            return false; // 如果满了，返回 false 告知调用方失败
        },
        _卸载模块(shipId, 模块类型, 索引index) {
            if (this.舰队库[shipId] && this.舰队库[shipId][模块类型]) {
                this.舰队库[shipId][模块类型].splice(索引index, 1);
                引擎信号.需要重新结算 = true;
            }
        },

        // ================= 硬盘物资读写操作 (仅供底层引擎调用) =================
        _硬盘写入物资(shipId, 物品id, 数量) {
            const ship = this.舰队库[shipId];
            if (!ship || 数量 <= 0) return false;

            const 物品数据 = 获取物品数据(物品id);
            const 增加质量 = 数量 * (物品数据?.字节 || 1);

            // 🌟 核心防线：预计算写入后的总质量
            const 当前质量 = this.获取飞船已载质量(shipId);
            const 最大容量 = this.获取飞船最大容量(shipId);

            if (当前质量 + 增加质量 > 最大容量) {
                // 如果空间不足，严禁写入
                console.error(`🚨 [飞船溢出防御] 飞船 ${shipId} 尝试装载 ${数量}个 ${物品id}，需空间 ${增加质量}B，但剩余空间仅 ${最大容量 - 当前质量}B！操作已拦截。`);
                return false;
            }

            // 执行实际写入
            if (!ship.载货清单[物品id]) ship.载货清单[物品id] = 0;
            ship.载货清单[物品id] += 数量;

            // 写入成功不需要触发重新结算，因为已载质量的变化会自动通过 Getter 反映到速度上
            return true;
        },
        _硬盘扣除物资(shipId, 物品id, 数量) {
            const ship = this.舰队库[shipId];
            if (!ship || !ship.载货清单[物品id] || ship.载货清单[物品id] < 数量) return false;
            ship.载货清单[物品id] -= 数量;
            if (ship.载货清单[物品id] <= 0) delete ship.载货清单[物品id];
            return true;
        },
        _强制清空硬盘(shipId) {
            const ship = this.舰队库[shipId];
            if (ship) ship.载货清单 = {};
        },

        // ================= 存档接口 =================
        导出数据() {
            return {
                舰队库: this.舰队库,
                飞船序列号: this.飞船序列号
            };
        },
        导入数据(存档数据) {
            if (存档数据 && 存档数据.舰队库) {
                this.舰队库 = 存档数据.舰队库;
                if (存档数据.飞船序列号 !== undefined) {
                    this.飞船序列号 = 存档数据.飞船序列号; // 🌟 恢复计数器
                }
            }
        }
    }
});