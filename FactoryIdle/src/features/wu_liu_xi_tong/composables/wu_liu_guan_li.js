// src/features/wu_liu_xi_tong/composables/wu_liu_guan_li.js
import { use飞船实体系统 } from '../store_fei_chuan.js';
import { use航线调度系统 } from '../store_hang_xian.js';
import { use库存 } from '@/features/wu_pin_xi_tong/index.js';
import { use计算机系统 } from '@/features/ji_suan_ji_xi_tong/store.js';
import { 获取物品数据 } from '@/shared/pei_zhi_shu_ju.js';
import { 引擎信号 } from '@/core/quan_ju_xin_hao.js';
import { useMessage } from 'naive-ui';

// ================== 全局独立物理逻辑 (供 Tick 引擎后台调用，严禁包含任何 UI Hook) ==================

export const 强制停泊核心 = (shipId) => {
    const 飞船库 = use飞船实体系统();
    const 航线库 = use航线调度系统();
    const ship = 飞船库.获取飞船(shipId);
    if (!ship) return;

    航线库._清空航线(shipId);

    if (ship.当前状态 === '航行中') {
        // 保持“航行中”，让 Tick 引擎推完最后的进度
    } else {
        if (ship.当前状态 === '排队中' || ship.当前状态 === '装卸中') {
            航线库._移出港口队列(shipId, ship.当前位置);
        }
        ship.当前状态 = '停泊中';
        ship.目标位置 = null;
        ship.航行进度 = 0;
    }
};

const 完成节点并发车 = (shipId, 当前cid, ship, 任务表) => {
    const 航线库 = use航线调度系统();
    航线库._移出港口队列(shipId, 当前cid);
    航线库._推进到下一个节点(shipId);

    const 下一节点 = 任务表.航线指令[任务表.节点索引];
    if (下一节点) {
        if (ship.当前位置 === 下一节点.节点星系CID) {
            ship.当前状态 = '排队中';
            航线库._加入港口队列(shipId, ship.当前位置);
        } else {
            ship.当前状态 = '航行中';
            ship.目标位置 = 下一节点.节点星系CID;
            ship.航行进度 = 0;
        }
    } else {
        强制停泊核心(shipId);
    }
};

const _处理装载逻辑 = (shipId, cid, 拟搬运数, 当前动作, 停靠规则, 任务表) => {
    const 飞船库 = use飞船实体系统();
    const 航线库 = use航线调度系统();
    const 库存 = use库存();
    
    const 物品数据 = 获取物品数据(当前动作.物品id);
    const 单体字节 = 物品数据?.字节 || 1;

    const 基地库存数 = 库存.查询库存(当前动作.物品id, cid);
    const 飞船剩余空间 = Math.floor(Math.max(0, 飞船库.获取飞船最大容量(shipId) - 飞船库.获取飞船已载质量(shipId)) / 单体字节);

    const 可装数 = Math.min(拟搬运数, 基地库存数, 飞船剩余空间);

    if (可装数 > 0 && 库存.库存减少(当前动作.物品id, 可装数, cid)) {
        飞船库._硬盘写入物资(shipId, 当前动作.物品id, 可装数);
        航线库._记录动作传输量(shipId, 可装数);
        return 可装数;
    } else {
        const 是否未达标 = (当前动作.目标数量 === '全部') ? (飞船剩余空间 > 0) : (任务表.动作已传数量 < 当前动作.目标数量);
        if (!(停靠规则 === '等待装满' && 是否未达标)) {
            航线库._推进到下一个动作(shipId);
        }
        return 0;
    }
};

const _处理卸载逻辑 = (shipId, cid, 拟搬运数, 当前动作, 停靠规则, 任务表) => {
    const 飞船库 = use飞船实体系统();
    const 航线库 = use航线调度系统();
    const 库存 = use库存();
    const 计算机 = use计算机系统();
    
    const ship = 飞船库.获取飞船(shipId);
    const 飞船有货数 = ship.载货清单[当前动作.物品id] || 0;
    const 基地可塞数 = Math.max(0, 计算机.获取物品库存上限(当前动作.物品id, cid) - 库存.查询库存(当前动作.物品id, cid));

    const 可卸数 = Math.min(拟搬运数, 飞船有货数, 基地可塞数);

    if (可卸数 > 0 && 飞船库._硬盘扣除物资(shipId, 当前动作.物品id, 可卸数)) {
        库存.库存增加(当前动作.物品id, 可卸数, cid);
        航线库._记录动作传输量(shipId, 可卸数);
        return 可卸数;
    } else {
        const 是否未清空 = (当前动作.目标数量 === '全部') ? (飞船有货数 > 0) : (任务表.动作已传数量 < 当前动作.目标数量);
        if (!(停靠规则 === '等待清空' && 是否未清空)) {
            航线库._推进到下一个动作(shipId);
        }
        return 0;
    }
};

const _执行单船吞吐任务 = (shipId, cid, 实际可用带宽, dt) => {
    const 飞船库 = use飞船实体系统();
    const 航线库 = use航线调度系统();
    const ship = 飞船库.获取飞船(shipId);
    const 任务表 = 航线库.执行中的航线表[shipId];
    if (!ship || !任务表) return;

    if (ship.当前状态 === '排队中') ship.当前状态 = '装卸中';

    const 当前节点 = 任务表.航线指令[任务表.节点索引];
    const 当前动作 = 当前节点?.操作列表[任务表.动作索引];

    if (!当前动作) {
        完成节点并发车(shipId, cid, ship, 任务表);
        return;
    }

    const 本帧字节预算 = 实际可用带宽 * dt;
    const 单体字节 = 获取物品数据(当前动作.物品id)?.字节 || 1;
    航线库._记录字节传输量(shipId, 本帧字节预算);

    const 理论应完成总数 = Math.floor(任务表.动作已传字节 / 单体字节);
    let 本帧拟搬运数 = 理论应完成总数 - 任务表.动作已传数量;

    if (当前动作.目标数量 !== '全部') {
        const 还需要搬运数 = Math.max(0, 当前动作.目标数量 - 任务表.动作已传数量);
        本帧拟搬运数 = Math.min(本帧拟搬运数, 还需要搬运数);
    }

    let 实际搬运数 = 0;
    if (本帧拟搬运数 > 0) {
        if (当前动作.动作 === '装载') {
            实际搬运数 = _处理装载逻辑(shipId, cid, 本帧拟搬运数, 当前动作, 当前节点.停靠规则, 任务表);
        } else {
            实际搬运数 = _处理卸载逻辑(shipId, cid, 本帧拟搬运数, 当前动作, 当前节点.停靠规则, 任务表);
        }
    }

    if (实际搬运数 < 本帧拟搬运数) {
        任务表.动作已传字节 = 任务表.动作已传数量 * 单体字节;
    }

    if (当前动作.目标数量 !== '全部' && 任务表.动作已传数量 >= 当前动作.目标数量) {
        航线库._推进到下一个动作(shipId);
    }
};

const _获取在港活跃船只 = (cid, 并发上限) => {
    const 飞船库 = use飞船实体系统();
    const 航线库 = use航线调度系统();
    const 库存 = use库存();
    const 计算机 = use计算机系统();

    const 队列 = 航线库.星系港口队列[cid] || [];
    const 活跃列表 = [];

    for (const shipId of 队列) {
        if (活跃列表.length >= 并发上限) break;

        const ship = 飞船库.获取飞船(shipId);
        const 任务表 = 航线库.执行中的航线表[shipId];
        if (!ship || !任务表) continue;

        const 当前节点 = 任务表.航线指令[任务表.节点索引];
        const 当前动作 = 当前节点?.操作列表[任务表.动作索引];

        if (!当前动作) {
            活跃列表.push(shipId);
            continue;
        }

        const 停靠规则 = 当前节点.停靠规则;
        if (停靠规则 === '按次序执行即走') {
            活跃列表.push(shipId);
            continue;
        }

        const 物品数据 = 获取物品数据(当前动作.物品id);
        const 单体字节 = 物品数据?.字节 || 1;
        let 是否物理活跃 = false;

        if (当前动作.动作 === '装载') {
            const 基地库存 = 库存.查询库存(当前动作.物品id, cid);
            const 飞船余量 = 飞船库.获取飞船最大容量(shipId) - 飞船库.获取飞船已载质量(shipId);
            if (基地库存 > 0 && 飞船余量 >= 单体字节) 是否物理活跃 = true;
        } else if (当前动作.动作 === '卸载') {
            const 飞船存货 = ship.载货清单[当前动作.物品id] || 0;
            const 基地余量 = 计算机.获取物品库存上限(当前动作.物品id, cid) - 库存.查询库存(当前动作.物品id, cid);
            if (飞船存货 > 0 && 基地余量 >= 单体字节) 是否物理活跃 = true;
        }

        if (是否物理活跃) {
            活跃列表.push(shipId);
        }
    }
    return 活跃列表;
};

const _分配作业带宽 = (活跃船只Ids, 基地总带宽) => {
    const 飞船库 = use飞船实体系统();
    let 总申请带宽 = 0;
    const 权重表 = {};

    for (const shipId of 活跃船只Ids) {
        const bw = 飞船库.获取飞船网卡带宽(shipId);
        权重表[shipId] = bw;
        总申请带宽 += bw;
    }

    const 分配结果 = {};
    for (const shipId of 活跃船只Ids) {
        分配结果[shipId] = (总申请带宽 <= 基地总带宽)
            ? 权重表[shipId]
            : (权重表[shipId] / 总申请带宽) * 基地总带宽;
    }
    return 分配结果;
};

// 👇 以下两个函数彻底脱离 UI 依赖，可供时间轴安全调用
export const 执行航行推演 = (dt) => {
    const 飞船库 = use飞船实体系统();
    const 航线库 = use航线调度系统();
    for (const shipId in 飞船库.舰队库) {
        const ship = 飞船库.舰队库[shipId];
        if (ship.当前状态 !== '航行中') continue;

        const 总推力 = 飞船库.获取飞船总推力(shipId);
        const 总质量 = 飞船库.获取飞船总质量(shipId);

        const 速度 = Math.max(0.1, 总推力 / Math.max(1, 总质量));
        const 目标距离 = 1000; 
        const 每秒增加进度 = (速度 / 目标距离) * 100;

        ship.航行进度 += 每秒增加进度 * dt;

        if (ship.航行进度 >= 100) {
            ship.航行进度 = 100;
            ship.当前状态 = '排队中';
            ship.当前位置 = ship.目标位置;
            ship.目标位置 = null;

            const 任务表 = 航线库.执行中的航线表[shipId];

            if (任务表) {
                ship.当前状态 = '排队中';
                航线库._加入港口队列(shipId, ship.当前位置);
            } else {
                ship.当前状态 = '停泊中';
                ship.航行进度 = 0;
            }
            引擎信号.需要重新结算 = true;
        }
    }
};

export const 执行港口吞吐 = (dt) => {
    const 航线库 = use航线调度系统();
    const 计算机 = use计算机系统();
    for (const cid in 航线库.星系港口队列) {
        const { 总带宽, 并发上限 } = 计算机.获取基地网络性能(cid);
        const 活跃Ids = _获取在港活跃船只(cid, 并发上限);
        if (活跃Ids.length === 0) continue;

        const 带宽表 = _分配作业带宽(活跃Ids, 总带宽);

        for (const shipId of 活跃Ids) {
            _执行单船吞吐任务(shipId, cid, 带宽表[shipId], dt);
        }
    }
};

// ================== 玩家触发指令 (仅供 Vue 视图层按键点击时调用) ==================
export function use物流引擎() {
    const 飞船库 = use飞船实体系统();
    const 航线库 = use航线调度系统();
    const message = useMessage();

    const 触发启航 = (shipId, 航线数组) => {
        const ship = 飞船库.获取飞船(shipId);
        if (!ship || !航线数组 || 航线数组.length === 0) return;

        const 导航能力 = 飞船库.获取飞船导航能力(shipId);
        if (航线数组.length > 导航能力) {
            message.error(`[硬件受限] 当前飞船导航系统仅支持 ${导航能力} 个节点，无法解析包含 ${航线数组.length} 个节点的复杂航线。`);
            return;
        }
        航线库._分配航线(shipId, 航线数组);

        const 目标cid = 航线数组[0].节点星系CID;
        if (ship.当前位置 === 目标cid) {
            ship.当前状态 = '排队中';
            航线库._加入港口队列(shipId, 目标cid);
        } else {
            ship.当前状态 = '航行中';
            ship.目标位置 = 目标cid;
            ship.航行进度 = 0;
        }
    };

    const 触发强制停泊 = (shipId) => {
        强制停泊核心(shipId);
    };

    return { 触发启航, 触发强制停泊 };
}