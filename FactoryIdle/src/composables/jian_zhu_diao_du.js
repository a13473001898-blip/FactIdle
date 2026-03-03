// src/composables/jian_zhu_diao_du.js
import { use库存 } from '@/stores/ku_cun.js';
import { use计算机系统 } from '@/stores/ji_suan_ji_xi_tong.js';
import { use配方分配 } from '@/stores/pei_fang_fen_pei.js';
import { 获取物品数据 } from '@/pei_zhi_shu_ju.js';
import { useMessage } from 'naive-ui';
import { use算力监控 } from './suan_li_jian_kong.js';

export function use建筑调度() {
    const 库存 = use库存();
    const 计算机 = use计算机系统();
    const 配方分配 = use配方分配();
    const message = useMessage();

    // ================= 增加机器分配=================
    const 尝试增加分配 = (配方id, 建筑id, 期望增加数量, cid, lineId = 'default') => {
        if (!cid) {
            console.error(`🚨 [致命防御] 尝试增加机器分配但未提供 cid！`);
            return false;
        }

        const 当前库存 = 库存.查询库存(建筑id); // 云端建筑库存
        let 实际可增加数量 = Math.floor(Math.min(期望增加数量, 当前库存));

        if (实际可增加数量 <= 0) {
            if (当前库存 <= 0) message.warning('库存中没有空闲的该机器了！');
            return false;
        }

        const 物品数据 = 获取物品数据(建筑id);
        const 单台内存 = 物品数据?.字节 || 1;

        // 内存校验
        if (单台内存 > 0) {
            const 剩余内存 = Math.max(0, 计算机.总内存容量(cid) - 计算机.已用内存容量(cid));
            const 内存允许最大数量 = Math.floor(剩余内存 / 单台内存);
            实际可增加数量 = Math.min(实际可增加数量, 内存允许最大数量);

            if (实际可增加数量 <= 0) {
                message.warning('算力/内存不足！请检查该殖民地的计算中心。');
                return false;
            }
        }

        const { 校验能否塞入机器 } = use算力监控();
        if (!校验能否塞入机器(lineId, 建筑id, 实际可增加数量, cid)) {
            message.warning('主板 CPU 算力频率不足！无法承载更多机器，请升级 CPU 或开辟新生产线。');
            return false;
        }

        // 校验通过，扣库存
        const 扣除成功 = 库存.库存减少(建筑id, 实际可增加数量, 'cloud_item_dummy_cid');
        if (!扣除成功) return false;

        // 分配到指定生产线
        配方分配._增加数量(lineId, 配方id, 建筑id, 实际可增加数量, cid);
        return true;
    };

    // ================= 减少机器分配 =================
    const 尝试减少分配 = (配方id, 建筑id, 期望减少数量, cid, lineId = 'default') => {
        if (!cid) {
            console.error('🚨 [致命防御] 尝试减少机器分配但未提供 cid!');
            return false;
        }

        const 当前已分配 = 配方分配.查询分配数量(lineId, 配方id, 建筑id, cid);
        const 实际减少数量 = Math.floor(Math.min(期望减少数量, 当前已分配));

        if (实际减少数量 <= 0) return false;

        配方分配._减少数量(lineId, 配方id, 建筑id, 实际减少数量, cid);
        库存.库存增加(建筑id, 实际减少数量, 'cloud_item_dummy_cid');

        return true;
    };

    // ================= 切换机器状态 =================
    const 切换状态 = (配方id, 建筑id, cid, lineId = 'default') => {
        if (!cid) {
            console.error('🚨 [致命防御] 尝试切换机器状态但未提供 cid！');
            return false;
        }
        配方分配._切换状态(lineId, 配方id, 建筑id, cid);
        return true;
    };

    return {
        尝试增加分配,
        尝试减少分配,
        切换状态
    };
}