// src/features/sheng_chan_xi_tong/composables/sheng_chan_xian_guan_li.js
import { computed,unref } from 'vue';
import { use生产线系统 } from '@/features/sheng_chan_xi_tong';
import { use配方分配 } from '@/features/sheng_chan_xi_tong';
import { use建筑调度 } from '@/features/sheng_chan_xi_tong';
import { use殖民地系统 } from '@/features/zhi_min_di_xi_tong';
import { use计算机系统 } from '@/features/ji_suan_ji_xi_tong';
import { useMessage } from 'naive-ui';
import { 全局常量 } from '@/shared/constants';
import { 获取建筑数据, 获取配方数据, 获取物品数据, 获取所有配方列表} from '@/shared/pei_zhi_shu_ju';
import { use算力监控 } from '@/features/ji_suan_ji_xi_tong/composables/suan_li_jian_kong.js';

export function use生产线管理() {
    const 生产线系统 = use生产线系统();
    const 配方分配 = use配方分配();
    const 建筑调度 = use建筑调度();
    const 殖民地系统 = use殖民地系统();
    const 计算机 = use计算机系统();
    const message = useMessage();
    const { 计算生产线负载, 获取单核频率上限 } = use算力监控();

    // ================= 基础查询 =================
    
    // 获取当前殖民地空闲核心数
    const 获取空闲核心数 = (cid) => {
        const { 获取总核心数 } = use算力监控();
        const 总核数 = 获取总核心数(cid);
        // 空闲 = 总数 - default占用的1个 - 用户自建的数量
        const 自建线数量 = 生产线系统.数据[cid]?.length || 0;
        return Math.max(0, 总核数 - 1 - 自建线数量);
    };

    const 获取首个空闲核心索引 = (cid, 总核数) => {
        const 已占用 = new Set();
        已占用.add(0); // 0号核心永远锁死给 default 散装区

        const 用户线 = 生产线系统.数据[cid] || [];
        用户线.forEach(l => 已占用.add(l.绑定核心索引));

        for (let i = 1; i < 总核数; i++) {
            if (!已占用.has(i)) return i; 
        }
        return -1;
    };

    /** * 获取指定生产线的核心监控指标 (电力、内存、吞吐)
     * @param {string} lineId 
     * @param {string} cid 
     */
    const 获取生产线核心指标 = (lineId, cid) => {
        return computed(() => {
            const 线上分配 = 配方分配.查询生产线(lineId, cid);
            let 总电力需求 = 0;
            let 总内存占用 = 0;
            const 物品吞吐 = {}; // 结构: { 物品id: { 产出, 消耗 } }

            for (const 配方id in 线上分配) {
                const 配方 = 获取配方数据(配方id);
                const 机器组 = 线上分配[配方id];

                for (const 建筑id in 机器组) {
                    const 分配 = 机器组[建筑id];
                    const 建筑 = 获取建筑数据(建筑id);
                    const 数量 = 分配.数量;

                    // 内存统计 (无论是否运行都占用算力/内存空间)
                    总内存占用 += 数量 * (获取物品数据(建筑id)?.字节 || 1);
                    
                    if (分配.状态 === '运行') {
                        // 电力统计
                        总电力需求 += 数量 * (建筑.能耗 || 0);
                        
                        // 理论吞吐统计 (基于机器速度和配方时间)
                        const 每秒批次 = (数量 * 建筑.速度) / 配方.时间;
                        配方.输入?.forEach(inItem => {
                            if (!物品吞吐[inItem.id]) 物品吞吐[inItem.id] = { 产出: 0, 消耗: 0 };
                            物品吞吐[inItem.id].消耗 += 每秒批次 * inItem.数量;
                        });
                        配方.输出?.forEach(outItem => {
                            if (!物品吞吐[outItem.id]) 物品吞吐[outItem.id] = { 产出: 0, 消耗: 0 };
                            物品吞吐[outItem.id].产出 += 每秒批次 * outItem.数量;
                        });
                    }
                }
            }
            
            const 负载 = 计算生产线负载(lineId, cid);
            // 找出绑定核心的上限 (此处示例核心0，实际应从产线元数据读取)
            const 产线列表 = 生产线系统.数据[cid] || [];
            const 产线元数据 = 产线列表.find(l => l.id === lineId);
            const 核心索引 = 产线元数据 ? 产线元数据.绑定核心索引 : 0;
            const 算力上限 = 获取单核频率上限(0, cid); 

            return { 总电力需求, 总内存占用, 物品吞吐, 负载, 算力上限 };
        });
    };

    /**
     * 根据多个目标物品 ID 递归追溯完整的生产链白名单
     * @param {string[]} 目标列表Ref 
     */
    const 获取生产链白名单 = (目标列表Ref) => {
        return computed(() => {
            const 列表 = unref(目标列表Ref) || [];
            if (!Array.isArray(列表) || 列表.length === 0) return [];
            
            const 结果 = new Set();
            const 队列 = [...列表];
            const 所有配方 = Object.values(获取所有配方列表());

            while (队列.length > 0) {
                const id = 队列.shift();
                if (结果.has(id)) continue;
                结果.add(id);

                // 寻找产出该物品的所有配方，并将其原料加入队列
                const 相关配方 = 所有配方.filter(r => r.输出?.some(out => out.id === id));
                相关配方.forEach(r => {
                    r.输入?.forEach(inItem => 队列.push(inItem.id));
                });
            }
            return Array.from(结果);
        });
    };

    // ================= 生命周期管理 =================

    const 创建生产线 = (名称 = '新生产线', cid = null) => {
        const 目标cid = cid || 殖民地系统.当前视角ID;
        if (!目标cid) {
            message.error('未指定殖民地');
            return null;
        }

        const { 获取总核心数 } = use算力监控();
        const 空闲核心 = 获取空闲核心数(目标cid);
        if (空闲核心 <= 0) {
            message.warning('没有空闲的CPU核心，无法创建新生产线');
            return null;
        }

        const 分配的核心索引 = 获取首个空闲核心索引(目标cid, 获取总核心数(目标cid));
        if (分配的核心索引 === -1) return null;

        const lineId = 'line_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);

        const 创建成功 = 生产线系统.创建生产线(目标cid, 名称, 分配的核心索引);
        if (!创建成功) {
            message.error('创建生产线失败');
            return null;
        }

        配方分配.初始化配方分配数据(lineId, null, null, 目标cid);
        message.success(`生产线“${名称}”创建成功，已挂载至核心 ${分配的核心索引}`);
        return lineId;
    };

    const 删除生产线 = (lineId, cid = null) => {
        const 目标cid = cid || 殖民地系统.当前视角ID;
        if (!目标cid || !lineId) return false;

        if (lineId === 全局常量.默认产线ID) {
            message.warning('默认生产线不可删除');
            return false;
        }

        const 该线分配 = 配方分配.查询生产线(lineId, 目标cid) || {};

        const 待移除机器名单 = [];
        for (const 配方id in 该线分配) {
            for (const 建筑id in 该线分配[配方id]) {
                const 分配数量 = 该线分配[配方id][建筑id]?.数量 || 0;
                if (分配数量 > 0) {
                    待移除机器名单.push({ 配方id, 建筑id, 数量: 分配数量 });
                }
            }
        }

        待移除机器名单.forEach(机器 => {
            建筑调度.尝试减少分配(机器.配方id, 机器.建筑id, 机器.数量, 目标cid, lineId);
        });

        配方分配._删除生产线(lineId, 目标cid);
        生产线系统._删除生产线记录(目标cid, lineId);

        message.success('生产线已安全拆除，设备已退回库存');
        return true;
    };

    const 重命名生产线 = (lineId, 新名称, cid = null) => {
        const 目标cid = cid || 殖民地系统.当前视角ID;
        if (!目标cid || !lineId) return false;
        生产线系统.重命名生产线(目标cid, lineId, 新名称);
        return true;
    };

    const 设置目标物品 = (lineId, 物品id, cid = null) => {
        const 目标cid = cid || 殖民地系统.当前视角ID;
        if (!目标cid || !lineId) return false;
        生产线系统.修改目标物品列表(目标cid, lineId, 物品id);
        return true;
    };

    // ================= 蓝图调度 =================

    const 导出生产线蓝图 = (lineId, cid) => {
        if (!cid || !lineId) return null;

        const 产线基本信息 = 生产线系统.数据[cid]?.find(l => l.id === lineId);
        if (!产线基本信息) {
            message.error('未找到该生产线信息');
            return null;
        }

        const 机器分配数据 = 配方分配.查询生产线(lineId, cid);

        const 蓝图对象 = {
            版本: '1.0',
            类型: '生产线蓝图',
            名称: 产线基本信息.名称,
            目标物品ID: 产线基本信息.目标物品ID列表,
            配方结构: 机器分配数据
        };

        return JSON.stringify(蓝图对象);
    };

    return {
        获取空闲核心数,
        创建生产线,
        删除生产线,
        重命名生产线,
        设置目标物品,
        导出生产线蓝图,
        获取生产线核心指标,
        获取生产链白名单,

    };
}