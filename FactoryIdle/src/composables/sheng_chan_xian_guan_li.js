// src/composables/sheng_chan_xian_guan_li.js
import { use生产线系统 } from '@/stores/sheng_chan_xian_xi_tong.js';
import { use配方分配 } from '@/stores/pei_fang_fen_pei.js';
import { use建筑调度 } from './jian_zhu_diao_du.js';
import { use殖民地系统 } from '@/stores/zhi_min_di_xi_tong.js';
import { use计算机系统 } from '@/stores/ji_suan_ji_xi_tong.js';
import { useMessage } from 'naive-ui';
import { use算力监控 } from './suan_li_jian_kong.js';


export function use生产线管理() {
    const 生产线系统 = use生产线系统();
    const 配方分配 = use配方分配();
    const 建筑调度 = use建筑调度();
    const 殖民地系统 = use殖民地系统();
    const 计算机 = use计算机系统();
    const message = useMessage();

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
            if (!已占用.has(i)) return i; // 找到第一个没被占用的坑位
        }
        return -1;
    };

    // 创建生产线
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

        // 安全获取不会发生冲突的核心索引
        const 分配的核心索引 = 获取首个空闲核心索引(目标cid, 获取总核心数(目标cid));
        if (分配的核心索引 === -1) return null;

        const lineId = 'line_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);

        // 传入安全的 核心索引
        const 创建成功 = 生产线系统.创建生产线(目标cid, 名称, 分配的核心索引);
        if (!创建成功) {
            message.error('创建生产线失败');
            return null;
        }

        配方分配.初始化配方分配数据(lineId, null, null, 目标cid);
        message.success(`生产线“${名称}”创建成功，已挂载至核心 ${分配的核心索引}`);
        return lineId;
    };

    // 删除生产线
    const 删除生产线 = (lineId, cid = null) => {
        const 目标cid = cid || 殖民地系统.当前视角ID;
        if (!目标cid || !lineId) {
            message.error('参数错误');
            return false;
        }

        if (lineId === 'default') {
            message.warning('默认生产线不可删除');
            return false;
        }

        // 弹出确认对话框（应由UI层处理，这里仅执行逻辑）
        // 此处假设外部已确认，直接执行

        // 获取该生产线所有配方分配
        const 该线分配 = 配方分配.查询生产线(lineId, 目标cid) || {};

        // 遍历所有配方和建筑，将机器退回库存
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

        // 从配方分配中移除该生产线数据（_减少数量后若数量为0会自动删除建筑条目，但生产线层级的空对象需要手动清理）
        // 配方分配 store 应提供一个清理空生产线的内部方法，或直接删除该线
        // 这里简单调用 store 的内部删除（需在配方分配中增加 _删除生产线 方法）
        配方分配._删除生产线(lineId, 目标cid);

        // 删除生产线元数据
        生产线系统._删除生产线记录(目标cid, lineId);

        message.success('生产线已删除');
        return true;
    };

    // 重命名生产线
    const 重命名生产线 = (lineId, 新名称, cid = null) => {
        const 目标cid = cid || 殖民地系统.当前视角ID;
        if (!目标cid || !lineId) return false;
        生产线系统.重命名生产线(目标cid, lineId, 新名称);
        return true;
    };

    // 设置生产线目标物品
    const 设置目标物品 = (lineId, 物品id, cid = null) => {
        const 目标cid = cid || 殖民地系统.当前视角ID;
        if (!目标cid || !lineId) return false;
        生产线系统.修改目标物品(目标cid, lineId, 物品id);
        return true;
    };

    return {
        创建生产线,
        删除生产线,
        重命名生产线,
        设置目标物品,
        获取空闲核心数
    };
}