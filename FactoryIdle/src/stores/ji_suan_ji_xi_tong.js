// src/stores/ji_suan_ji_xi_tong.js
import { defineStore } from 'pinia';
import { 获取物品数据, 物品ID, 获取物品存储类别, 获取所有物品列表 } from '@/pei_zhi_shu_ju.js';
import { use库存 } from '@/stores/ku_cun.js';
import { 引擎信号 } from '@/systems/quan_ju_xin_hao.js';
import { use配方分配 } from '@/stores/pei_fang_fen_pei.js';
import { use殖民地系统 } from './zhi_min_di_xi_tong.js';

function 物理机箱模板() {
    // 🌟 新增：云端配额 (划拨给全网云端的字节数)
    return { 装备的主板: null, 装备的CPU: [], 装备的内存: [], 装备的硬盘: [], 保底配额表: {}, 云端配额: 0 };
}

export const use计算机系统 = defineStore('ji_suan_ji_xi_tong', {
    state: () => ({
        本地插槽: {
            'main_base': {
                装备的主板: 物品ID.木质主板,
                装备的CPU: [物品ID.基础CPU],
                装备的内存: [物品ID.创造内存],
                装备的硬盘: [物品ID.创造物体硬盘],
                保底配额表: {},
                云端配额: 0 // 🌟 初始默认为 0
            }
        }
    }),

    getters: {
        _当前机箱: (state) => {
            const cid = use殖民地系统().当前视角ID;
            return state.本地插槽[cid] || 物理机箱模板();
        },
        当前平台: (state) => (cid) => {
            const 目标cid = cid || use殖民地系统().当前视角ID;
            const 机箱 = state.本地插槽[目标cid] || 物理机箱模板();
            if (!机箱.装备的主板) return null;
            return 获取物品数据(机箱.装备的主板)?.平台 || '未知';
        },
        槽位限制: (state) => (cid) => {
            const 目标cid = cid || use殖民地系统().当前视角ID;
            const 机箱 = state.本地插槽[目标cid] || 物理机箱模板();
            const 主板数据 = 获取物品数据(机箱.装备的主板);
            return {
                CPU: 主板数据?.CPU槽位 || 0,
                内存: 主板数据?.内存槽位 || 0,
                硬盘: 主板数据?.硬盘槽位 || 0
            };
        },
        总内存容量: (state) => (cid) => {
            const 目标cid = cid || use殖民地系统().当前视角ID;
            const 机箱 = state.本地插槽[目标cid] || 物理机箱模板();
            return 机箱.装备的内存.reduce((sum, id) => sum + (获取物品数据(id)?.提供内存 || 0), 0);
        },
        分类总容量: (state) => (cid) => {
            const 目标cid = cid || use殖民地系统().当前视角ID;
            const 机箱 = state.本地插槽[目标cid] || 物理机箱模板();
            const 统计 = { 物体: 0, 能源: 0, 流体: 0 };
            机箱.装备的硬盘.forEach(id => {
                const 硬件 = 获取物品数据(id);
                const 类别 = 硬件?.存储类别 || '物体';
                统计[类别] += 硬件?.提供容量 || 0;
            });
            return 统计;
        },
        分类已分配保底: (state) => (cid) => {
            const 目标cid = cid || use殖民地系统().当前视角ID;
            const 机箱 = state.本地插槽[目标cid] || 物理机箱模板();
            const 统计 = { 物体: 0, 能源: 0, 流体: 0 };
            for (const [id, 数量] of Object.entries(机箱.保底配额表)) {
                const 类别 = 获取物品存储类别(id);
                const 单体字节 = 获取物品数据(id)?.字节 || 1;
                统计[类别] += 数量 * 单体字节;
            }
            return 统计;
        },
        已用内存容量: () => (cid) => {
            const 配方分配 = use配方分配();
            const 目标cid = cid || use殖民地系统().当前视角ID;
            let 占用 = 0;
            const 本地所有线 = 配方分配.查询殖民地全部(目标cid);

            // 需要三层遍历：生产线 -> 配方 -> 机器
            for (const lineId in 本地所有线) {
                const 生产线数据 = 本地所有线[lineId];
                for (const 配方id in 生产线数据) {
                    const 机器列表 = 生产线数据[配方id];
                    for (const 建筑id in 机器列表) {
                        const 分配 = 机器列表[建筑id];
                        占用 += (分配.数量 || 0) * (获取物品数据(建筑id)?.字节 || 1);
                    }
                }
            }
            return 占用;
        },
        内存满足率: (state) => (cid) => {
            const 目标cid = cid || use殖民地系统().当前视角ID;
            const 已用 = use计算机系统().已用内存容量(目标cid);
            const 总量 = use计算机系统().总内存容量(目标cid);
            if (总量 === 0 && 已用 > 0) return 0;
            if (已用 > 总量) return 总量 / 已用;
            return 1;
        },
        已用硬盘容量: () => (cid) => {
            const 库存 = use库存();
            const 目标cid = cid || use殖民地系统().当前视角ID;
            let 总已用 = 0;
            const 所有物品 = 获取所有物品列表();
            for (const 物品id in 所有物品) {
                if (所有物品[物品id].类型 !== '建筑' && 所有物品[物品id].类型 !== '计算机硬件') {
                    总已用 += (库存.查询库存(物品id, 目标cid) || 0) * (所有物品[物品id].字节 || 1);
                }
            }
            return 总已用;
        },
        总硬盘容量: (state) => (cid) => {
            const 目标cid = cid || use殖民地系统().当前视角ID;
            const 机箱 = state.本地插槽[目标cid] || 物理机箱模板();
            let total = 0;
            机箱.装备的硬盘.forEach(id => {
                total += 获取物品数据(id)?.提供容量 || 0;
            });
            return total;
        },

        // 🌟 新增：全网总云端容量 (遍历所有殖民地相加)
        全网总云端容量: (state) => {
            let total = 0;
            for (const cid in state.本地插槽) {
                total += state.本地插槽[cid].云端配额 || 0;
            }
            return total;
        },

        // 🌟 新增：全网已用云端容量 (遍历云端库里的实体建筑和硬件)
        全网已用云端容量: () => {
            const 库存 = use库存();
            let used = 0;
            const 云端库 = 库存.云端数据 || {};
            for (const 物品id in 云端库) {
                const 物品数据 = 获取物品数据(物品id);
                if (物品数据) {
                    used += (云端库[物品id] || 0) * (物品数据.字节 || 1);
                }
            }
            return used;
        },

        公共池状态: (state) => (cid) => {
            const 目标cid = cid || use殖民地系统().当前视角ID;
            const 库存 = use库存();
            const 机箱 = state.本地插槽[目标cid] || 物理机箱模板();
            const 状态 = {
                物体: { 总量: 0, 已用: 0, 剩余: 0 },
                能源: { 总量: 0, 已用: 0, 剩余: 0 },
                流体: { 总量: 0, 已用: 0, 剩余: 0 }
            };

            const 统计总容量 = { 物体: 0, 能源: 0, 流体: 0 };
            机箱.装备的硬盘.forEach(id => {
                统计总容量[获取物品数据(id)?.存储类别 || '物体'] += 获取物品数据(id)?.提供容量 || 0;
            });

            const 统计已分配保底 = { 物体: 0, 能源: 0, 流体: 0 };
            for (const [id, 数量] of Object.entries(机箱.保底配额表)) {
                统计已分配保底[获取物品存储类别(id)] += 数量 * (获取物品数据(id)?.字节 || 1);
            }

            for (const 类别 of ['物体', '能源', '流体']) {
                const 该类总容量 = 统计总容量[类别] || 0;
                // 🌟 核心：如果是物体硬盘，必须先把“上划给云端”的空间扣掉
                const 云端占用 = 类别 === '物体' ? (机箱.云端配额 || 0) : 0;
                const 该类总保底 = 统计已分配保底[类别] + 云端占用;

                const 公共池总量 = Math.max(0, 该类总容量 - 该类总保底);
                let 公共池已用 = 0;

                const 所有物品 = 获取所有物品列表();
                for (const 物品id in 所有物品) {
                    if (获取物品存储类别(物品id) === 类别 && 所有物品[物品id].类型 !== '建筑' && 所有物品[物品id].类型 !== '计算机硬件') {
                        const 单体字节 = 所有物品[物品id].字节 || 1;
                        const 当前占用字节 = (库存.查询库存(物品id, 目标cid) || 0) * 单体字节;
                        const 专属保底字节 = (机箱.保底配额表[物品id] || 0) * 单体字节;
                        const 溢出字节 = Math.max(0, 当前占用字节 - 专属保底字节);
                        公共池已用 += 溢出字节;
                    }
                }

                状态[类别].总量 = 公共池总量;
                状态[类别].已用 = 公共池已用;
                状态[类别].剩余 = Math.max(0, 公共池总量 - 公共池已用);
            }
            return 状态;
        },

        获取物品库存上限(state) {
            return (物品id, colonyId) => {
                const cid = colonyId || use殖民地系统().当前视角ID;
                const 物品数据 = 获取物品数据(物品id);
                const 单体字节 = 物品数据?.字节 || 1;

                // 🌟 核心：如果是云端物品，不再无限大，而是受全局云端空间限制！
                if (物品数据?.类型 === '建筑' || 物品数据?.类型 === '计算机硬件') {
                    const 库存 = use库存();
                    const 当前占用字节 = (库存.查询库存(物品id, 'cloud') || 0) * 单体字节;
                    // ✅ 修复：使用 this 访问其他的 Getter
                    const 全网剩余空间 = Math.max(0, this.全网总云端容量 - this.全网已用云端容量);
                    return Math.floor((当前占用字节 + 全网剩余空间) / 单体字节);
                }

                const 库存 = use库存();
                const 类别 = 获取物品存储类别(物品id);
                const 机箱 = state.本地插槽[cid] || 物理机箱模板();
                const 当前占用字节 = (库存.查询库存(物品id, cid) || 0) * 单体字节;
                const 专属保底字节 = (机箱.保底配额表[物品id] || 0) * 单体字节;

                // ✅ 修复：使用 this 访问其他的 Getter
                const 指定池状态 = this.公共池状态(cid);
                const 公共池剩余 = 指定池状态[类别].剩余;

                const 最大允许字节 = Math.max(专属保底字节, 当前占用字节) + 公共池剩余;
                return Math.floor(最大允许字节 / 单体字节);
            };
        },

        分类已用容量: (state) => (category, cid) => {
            const 库存 = use库存();
            const 目标cid = cid || use殖民地系统().当前视角ID;
            const 所有物品 = 获取所有物品列表();
            let totalUsed = 0;

            for (const 物品id in 所有物品) {
                const 物品 = 所有物品[物品id];
                // 排除建筑和硬件（它们在云端库），只统计本地仓库的物资
                if (物品.类型 !== '建筑' && 物品.类型 !== '计算机硬件') {
                    if (获取物品存储类别(物品id) === category) {
                        totalUsed += (库存.查询库存(物品id, 目标cid) || 0) * (物品.字节 || 1);
                    }
                }
            }
            return totalUsed;
        },
    },

    actions: {
        初始化新殖民地(cid) {
            if (!cid) { console.error("🚨 [致命防御] 计算机初始化新殖民地 缺省 cid！"); return 物理机箱模板(); }
            if (!this.本地插槽[cid]) this.本地插槽[cid] = 物理机箱模板();
            return this.本地插槽[cid];
        },

        // 🌟 新增：设置本地划拨给云端的配额
        _设置云端配额(目标字节, cid) {
            const 机箱 = this.初始化新殖民地(cid);
            机箱.云端配额 = 目标字节;
            引擎信号.需要重新结算 = true;
        },
        _安装主板(物品id, cid) {
            this.初始化新殖民地(cid).装备的主板 = 物品id;
            引擎信号.需要重新结算 = true;
        },
        _卸载主板(cid) {
            this.初始化新殖民地(cid).装备的主板 = null;
            引擎信号.需要重新结算 = true;
        },
        _安装CPU(物品id, cid) {
            this.初始化新殖民地(cid).装备的CPU.push(物品id)
            引擎信号.需要重新结算 = true
        },

        _卸载CPU(索引index, cid) {
            this.初始化新殖民地(cid).装备的CPU.splice(索引index, 1)
            引擎信号.需要重新结算 = true
        },
        _安装内存(物品id, cid) {
            this.初始化新殖民地(cid).装备的内存.push(物品id);
            引擎信号.需要重新结算 = true;
        },
        _卸载内存(索引index, cid) {
            this.初始化新殖民地(cid).装备的内存.splice(索引index, 1);
            引擎信号.需要重新结算 = true;
        },
        _安装硬盘(物品id, cid) {
            this.初始化新殖民地(cid).装备的硬盘.push(物品id);
            引擎信号.需要重新结算 = true;
        },
        _卸载硬盘(索引index, cid) {
            this.初始化新殖民地(cid).装备的硬盘.splice(索引index, 1);
            引擎信号.需要重新结算 = true;
        },
        _设置保底配额(物品id, 目标数量, cid) {
            const 机箱 = this.初始化新殖民地(cid);
            if (目标数量 === 0) {
                delete 机箱.保底配额表[物品id];
            } else {
                机箱.保底配额表[物品id] = 目标数量;
            }
            引擎信号.需要重新结算 = true;
        },

        _强制清空机箱(cid) {
            const 机箱 = this.初始化新殖民地(cid)
            机箱.装备的主板 = null
            机箱.装备的CPU = []
            机箱.装备的内存 = []
            机箱.装备的硬盘 = []
            机箱.云端配额 = 0;
            引擎信号.需要重新结算 = true
        },

        导出数据() { return { 本地插槽: this.本地插槽 }; },
        导入数据(存档数据, 版本号) {
            if (!存档数据) return;
            if (存档数据.装备的主板 !== undefined && !存档数据.本地插槽) {
                this.本地插槽 = {
                    'main_base': {
                        装备的主板: 存档数据.装备的主板, 装备的CPU: 存档数据.装备的CPU,
                        装备的内存: 存档数据.装备的内存 || [], 装备的硬盘: 存档数据.装备的硬盘 || [],
                        保底配额表: 存档数据.保底配额表 || {}, 云端配额: 0
                    }
                };
            } else if (存档数据.本地插槽) {
                this.本地插槽 = 存档数据.本地插槽;
            }
        }
    }
});