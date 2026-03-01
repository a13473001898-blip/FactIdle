import { defineStore } from 'pinia';
import { 获取物品数据, 物品ID, 获取物品存储类别, 获取所有物品列表 } from '@/pei_zhi_shu_ju.js';
import { use库存 } from '@/stores/ku_cun.js';
import { 引擎信号 } from '@/systems/quan_ju_xin_hao.js';
import { use配方分配 } from '@/stores/pei_fang_fen_pei.js';
import { 获取建筑数据 } from '@/pei_zhi_shu_ju.js';

export const use计算机系统 = defineStore('ji_suan_ji_xi_tong', {
    state: () => ({
        // --- 物理硬件插槽 ---
        装备的主板: 物品ID.木质主板,
        装备的CPU: null,
        装备的内存: [物品ID.创造内存],
        装备的硬盘: [物品ID.创造物体硬盘],

        // --- 软件配置表 (保底配额) ---
        保底配额表: {}
    }),

    getters: {
        当前平台: (state) => {
            if (!state.装备的主板) return null;
            return 获取物品数据(state.装备的主板)?.平台 || '未知';
        },
        槽位限制: (state) => {
            const 主板数据 = 获取物品数据(state.装备的主板);
            return {
                CPU: 主板数据?.CPU槽位 || 0,
                内存: 主板数据?.内存槽位 || 0,
                硬盘: 主板数据?.硬盘槽位 || 0
            };
        },
        总内存容量: (state) => {
            return state.装备的内存.reduce((sum, id) => sum + (获取物品数据(id)?.提供内存 || 0), 0);
        },

        分类总容量: (state) => {
            const 统计 = { 物体: 0, 能源: 0, 流体: 0 };
            state.装备的硬盘.forEach(id => {
                const 硬件 = 获取物品数据(id);
                const 类别 = 硬件?.存储类别 || '物体';
                统计[类别] += 硬件?.提供容量 || 0;
            });
            return 统计;
        },

        分类已分配保底: (state) => {
            const 统计 = { 物体: 0, 能源: 0, 流体: 0 };
            for (const [id, 数量] of Object.entries(state.保底配额表)) {
                const 类别 = 获取物品存储类别(id);
                // 👇 新增：获取单体字节
                const 单体字节 = 获取物品数据(id)?.字节 || 1;
                // 👇 修改：数量 * 单体字节
                统计[类别] += 数量 * 单体字节;
            }
            return 统计;
        },

        已用内存容量: () => {
            // 直接调用顶部的 hook，Pinia 会自动处理循环依赖
            const 配方分配 = use配方分配();
            let 占用 = 0;
            for (const 配方id in 配方分配.数据) {
                for (const 建筑id in 配方分配.数据[配方id]) {
                    const 物品数据 = 获取物品数据(建筑id);
                    占用 += 配方分配.数据[配方id][建筑id].数量 * (物品数据?.字节 || 1);
                }
            }
            return 占用;
        },

        内存满足率() {
            const 占用 = this.已用内存容量;
            const 总数 = this.总内存容量;
            if (总数 === 0 && 占用 > 0) return 0; // 一点内存没有但有机器，直接全厂瘫痪
            if (占用 > 总数) return 总数 / 占用; // 内存超载，全厂按比例降频
            return 1;
        },

        已用硬盘容量: (state) => {
            const 库存 = use库存();
            let 总已用 = 0;
            // 获取所有物品列表已经在文件顶部 import 了
            const 所有物品 = 获取所有物品列表();
            for (const 物品id in 所有物品) {
                const 单体字节 = 所有物品[物品id].字节 || 1;
                const 数量 = 库存.查询库存(物品id) || 0;
                总已用 += 数量 * 单体字节;
            }
            return 总已用;
        },

        总硬盘容量() {
            const stats = this.分类总容量;
            return (stats.物体 || 0) + (stats.能源 || 0) + (stats.流体 || 0);
        },

        // 🌟 核心：公共池状态计算 🌟
        公共池状态: (state) => {
            const 库存 = use库存();
            const 状态 = {
                物体: { 总量: 0, 已用: 0, 剩余: 0 },
                能源: { 总量: 0, 已用: 0, 剩余: 0 },
                流体: { 总量: 0, 已用: 0, 剩余: 0 }
            };

            for (const 类别 of ['物体', '能源', '流体']) {
                const 该类总容量 = state.分类总容量[类别] || 0;
                const 该类总保底 = state.分类已分配保底[类别] || 0;

                const 公共池总量 = Math.max(0, 该类总容量 - 该类总保底);
                let 公共池已用 = 0;

                const 所有物品 = 获取所有物品列表();
                for (const 物品id in 所有物品) {
                    if (获取物品存储类别(物品id) === 类别) {
                        const 单体字节 = 所有物品[物品id].字节 || 1;
                        const 当前占用字节 = (库存.查询库存(物品id) || 0) * 单体字节;
                        const 专属保底字节 = (state.保底配额表[物品id] || 0) * 单体字节;

                        // 溢出占用的就是公共池的空间
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

        // 🌟 给结算引擎查询：该物品最大还能存多少？ 🌟
        获取物品库存上限: (state) => {
            return (物品id) => {
                const 库存 = use库存();
                const 物品数据 = 获取物品数据(物品id);
                const 类别 = 获取物品存储类别(物品id);
                const 单体字节 = 物品数据?.字节 || 1;

                const 当前占用字节 = (库存.查询库存(物品id) || 0) * 单体字节;
                const 专属保底字节 = (state.保底配额表[物品id] || 0) * 单体字节;
                const 公共池剩余 = state.公共池状态[类别].剩余;

                // 核心极值公式！
                const 最大允许字节 = Math.max(专属保底字节, 当前占用字节) + 公共池剩余;

                return Math.floor(最大允许字节 / 单体字节);
            }
        }
    },

    actions: {
        安装主板(物品id) {
            const 库存 = use库存();
            if (this.装备的主板) return false;
            if (库存.库存减少(物品id, 1)) {
                this.装备的主板 = 物品id;
                引擎信号.需要重新结算 = true;
                return true;
            }
            return false;
        },
        卸载主板() {
            const 库存 = use库存();
            if (!this.装备的主板) return false;
            if (this.装备的内存.length > 0 || this.装备的硬盘.length > 0 || this.装备的CPU) return false;
            库存.库存增加(this.装备的主板, 1);
            this.装备的主板 = null;
            引擎信号.需要重新结算 = true;
            return true;
        },

        安装CPU(物品id) {
            const 库存 = use库存();
            const 物品数据 = 获取物品数据(物品id);
            if (!this.装备的主板 || this.装备的CPU) return false;
            if (物品数据.平台 && 物品数据.平台 !== this.当前平台) return false;
            if (this.槽位限制.CPU < 1) return false;
            if (库存.库存减少(物品id, 1)) {
                this.装备的CPU = 物品id;
                引擎信号.需要重新结算 = true;
                return true;
            }
            return false;
        },
        卸载CPU() {
            const 库存 = use库存();
            if (!this.装备的CPU) return;
            库存.库存增加(this.装备的CPU, 1);
            this.装备的CPU = null;
            引擎信号.需要重新结算 = true;
        },

        安装内存(物品id) {
            const 库存 = use库存();
            const 物品数据 = 获取物品数据(物品id);
            if (!this.装备的主板) return false;
            if (物品数据.平台 && 物品数据.平台 !== this.当前平台) return false;
            if (this.装备的内存.length >= this.槽位限制.内存) return false;
            if (库存.库存减少(物品id, 1)) {
                this.装备的内存.push(物品id);
                引擎信号.需要重新结算 = true;
                return true;
            }
            return false;
        },
        卸载内存(索引index) {
            const 库存 = use库存();
            if (索引index < 0 || 索引index >= this.装备的内存.length) return;
            const 卸载的物品id = this.装备的内存.splice(索引index, 1)[0];
            库存.库存增加(卸载的物品id, 1);
            引擎信号.需要重新结算 = true;
        },

        安装硬盘(物品id) {
            const 库存 = use库存();
            const 物品数据 = 获取物品数据(物品id);
            if (!this.装备的主板) return false;
            if (物品数据.平台 && 物品数据.平台 !== this.当前平台) return false;
            if (this.装备的硬盘.length >= this.槽位限制.硬盘) return false;
            if (库存.库存减少(物品id, 1)) {
                this.装备的硬盘.push(物品id);
                引擎信号.需要重新结算 = true;
                return true;
            }
            return false;
        },
        卸载硬盘(索引index) {
            const 库存 = use库存();
            if (索引index < 0 || 索引index >= this.装备的硬盘.length) return false;

            const 拟卸载硬件 = 获取物品数据(this.装备的硬盘[索引index]);
            const 类别 = 拟卸载硬件?.存储类别 || '物体';
            const 损失容量 = 拟卸载硬件?.提供容量 || 0;

            if (this.分类总容量[类别] - 损失容量 < this.分类已分配保底[类别]) {
                return false;
            }

            const 卸载的物品id = this.装备的硬盘.splice(索引index, 1)[0];
            库存.库存增加(卸载的物品id, 1);
            引擎信号.需要重新结算 = true;
            return true;
        },

        设置保底配额(物品id, 目标数量) {
            if (目标数量 < 0) 目标数量 = 0;

            const 类别 = 获取物品存储类别(物品id);
            const 单体字节 = 获取物品数据(物品id)?.字节 || 1;

            // 核心逻辑：计算本次操作真正“新增”了多少个物品
            const 旧数量 = this.保底配额表[物品id] || 0;
            const 增加的数量 = 目标数量 - 旧数量;
            const 需要新增的字节 = 增加的数量 * 单体字节;

            const 该类总保底 = this.分类已分配保底[类别];
            const 该类总容量 = this.分类总容量[类别] || 0;

            // 超出物理上限拦截
            if (该类总保底 + 需要新增的字节 > 该类总容量) {
                return false;
            }

            // 数据写入：现在表里存的纯粹是“物品个数”
            if (目标数量 === 0) {
                delete this.保底配额表[物品id];
            } else {
                this.保底配额表[物品id] = 目标数量;
            }

            引擎信号.需要重新结算 = true;
            return true;
        },
    }
});