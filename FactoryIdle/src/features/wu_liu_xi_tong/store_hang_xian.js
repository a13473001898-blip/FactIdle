// src/features/wu_liu_xi_tong/store_hang_xian.js
import { defineStore } from 'pinia';
import { 引擎信号 } from '@/core/quan_ju_xin_hao.js';

export const use航线调度系统 = defineStore('hang_xian_diao_du_xi_tong', {
    state: () => ({
        /** * 执行中的航线表
         * 结构: { shipId: { 航线指令: [], 节点索引: 0, 动作索引: 0, 动作已传数量: 0 } }
         */
        执行中的航线表: {},

        /** * 星系港口队列 
         * 结构: { cid: [shipId1, shipId2, ...] }
         */
        星系港口队列: {},

        航线分组库: [], // 显式维护的分组列表
        航线蓝图库: {} // { route_id: { id, 名称, 分组, 分配的飞船: [], 航线指令: [] } }
    }),


    actions: {
        // ========== 基础数据读写 ==========

        _分配航线(shipId, 航线数组) {
            if (!航线数组 || 航线数组.length === 0) return;
            this.执行中的航线表[shipId] = {
                航线指令: 航线数组,
                节点索引: 0,
                动作索引: 0,
                动作已传数量: 0,
                动作已传字节: 0
            };
            引擎信号.需要重新结算 = true;
        },

        _记录字节传输量(shipId, 字节增加量) {
            if (this.执行中的航线表[shipId]) {
                this.执行中的航线表[shipId].动作已传字节 += 字节增加量;
            }
        },

        _清空航线(shipId) {
            delete this.执行中的航线表[shipId];
            引擎信号.需要重新结算 = true;
        },

        _加入港口队列(shipId, cid) {
            if (!this.星系港口队列[cid]) this.星系港口队列[cid] = [];
            if (!this.星系港口队列[cid].includes(shipId)) {
                this.星系港口队列[cid].push(shipId);
            }
        },

        _移出港口队列(shipId, cid) {
            if (this.星系港口队列[cid]) {
                const index = this.星系港口队列[cid].indexOf(shipId);
                if (index !== -1) this.星系港口队列[cid].splice(index, 1);
            }
        },

        // ========== 节点状态推进 ==========

        _记录动作传输量(shipId, 增加量) {
            if (this.执行中的航线表[shipId]) {
                this.执行中的航线表[shipId].动作已传数量 += 增加量;
            }
        },

        _推进到下一个动作(shipId) {
            const 任务表 = this.执行中的航线表[shipId];
            if (!任务表) return;

            任务表.动作索引++;
            任务表.动作已传数量 = 0; // 进度归零，准备执行下一个装卸操作
            任务表.动作已传字节 = 0
        },

        _推进到下一个节点(shipId) {
            const 任务表 = this.执行中的航线表[shipId];
            if (!任务表) return;

            任务表.节点索引++;
            if (任务表.节点索引 >= 任务表.航线指令.length) {
                任务表.节点索引 = 0; // 循环往复
            }
            任务表.动作索引 = 0;
            任务表.动作已传数量 = 0;
            任务表.动作已传字节 = 0;
        },
        // ========== 分组与蓝图管理 ==========

        _创建分组(名称) {
            if (!this.航线分组库.includes(名称)) {
                this.航线分组库.push(名称);
            }
        },
        _修改分组名称(老名称, 新名称) {
            if (!新名称 || this.航线分组库.includes(新名称)) return false;
            const index = this.航线分组库.indexOf(老名称);
            if (index !== -1) {
                this.航线分组库[index] = 新名称;
                // 同步更新所有属于该分组的航线
                Object.values(this.航线蓝图库).forEach(route => {
                    if (route.分组 === 老名称) route.分组 = 新名称;
                });
                return true;
            }
            return false;
        },

        _创建航线蓝图(名称 = '新建航线', 分组 = '默认分组') {
            const routeId = 'route_' + Date.now();
            this.航线蓝图库[routeId] = {
                id: routeId,
                名称,
                分组,
                分配的飞船: [],
                航线指令: []
            };
            return routeId;
        },
        _修改航线名称(routeId, 新名称) {
            if (this.航线蓝图库[routeId] && 新名称) {
                this.航线蓝图库[routeId].名称 = 新名称;
            }
        },

        // ========== 编队管理 ==========

        _分配飞船到航线(shipId, routeId) {
            const route = this.航线蓝图库[routeId];
            if (route && !route.分配的飞船.includes(shipId)) {
                route.分配的飞船.push(shipId);
                // 立刻将蓝图指令下发给飞船底层的“任务表”
                this._分配航线(shipId, JSON.parse(JSON.stringify(route.航线指令)));
            }
        },
        _将飞船踢出航线(shipId, routeId) {
            const route = this.航线蓝图库[routeId];
            if (route) {
                route.分配的飞船 = route.分配的飞船.filter(id => id !== shipId);
                // 清空飞船底层的任务表，触发强制停泊逻辑
                this._清空航线(shipId);
            }
        },

        // ========== 节点规则同步 ==========

        _保存并同步航线规则(routeId, 新指令数组) {
            const route = this.航线蓝图库[routeId];
            if (route) {
                route.航线指令 = JSON.parse(JSON.stringify(新指令数组));
                // 批量同步给旗下所有飞船
                route.分配的飞船.forEach(shipId => {
                    this._分配航线(shipId, JSON.parse(JSON.stringify(新指令数组)));
                });
            }
        },

        // ========== 存档接口 ==========
        导出数据() {
            return {
                执行中的航线表: this.执行中的航线表,
                星系港口队列: this.星系港口队列
            };
        },
        导入数据(存档数据) {
            if (存档数据) {
                if (存档数据.执行中的航线表) this.执行中的航线表 = 存档数据.执行中的航线表;
                if (存档数据.星系港口队列) this.星系港口队列 = 存档数据.星系港口队列;
            }
        }
    }
});