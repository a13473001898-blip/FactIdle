import { reactive, computed } from 'vue';
import { use库存 } from '@/stores/ku_cun.js';
import { use计算机系统 } from '@/stores/ji_suan_ji_xi_tong.js';
import { 获取配方数据 } from '@/pei_zhi_shu_ju.js';
import { 引擎信号 } from '@/systems/quan_ju_xin_hao';
import { use殖民地系统 } from '@/stores/zhi_min_di_xi_tong.js';

// 使用外部变量保证单例，全局只有一个手动生产进度
const 状态 = reactive({
    当前配方ID: null,
    目标殖民地ID: null,
    进度: 0,
    状态: '空闲', // '空闲' | '生产中' | '等待空间'
    剩余时间: 0
});

export function use手动生产() {
    const 库存 = use库存();
    const 计算机 = use计算机系统();
    const 殖民地系统 = use殖民地系统(); // 👈 获取系统

    const 开始生产 = (配方ID) => {
        if (状态.状态 !== '空闲') return;
        const 配方 = 获取配方数据(配方ID);
        if (!配方) return;

        // 👈 获取点击瞬间的所在星球
        const cid = 殖民地系统.当前视角ID; 

        // 1. 检查原料 (传入 cid)
        if (!库存.库存检查(配方.输入, 1, cid)) return;

        // 2. 立即扣除原料 (传入 cid)
        for (const 原料 of 配方.输入) {
            库存.库存减少(原料.id, 原料.数量, cid);
        }

        // 3. 初始化任务状态
        状态.当前配方ID = 配方ID;
        状态.目标殖民地ID = cid; // 👈 锁死目标星球
        状态.进度 = 0;
        状态.状态 = '生产中';
        状态.剩余时间 = 配方.时间;
    };

    const 逻辑更新 = (dt) => {
        if (状态.状态 === '空闲') return;

        const 配方 = 获取配方数据(状态.当前配方ID);
        if (!配方) return;
        
        const cid = 状态.目标殖民地ID; // 👈 读出锁死的星球

        if (状态.状态 === '生产中') {
            状态.剩余时间 -= dt;
            状态.进度 = Math.min(((配方.时间 - 状态.剩余时间) / 配方.时间) * 100, 100);

            if (状态.剩余时间 <= 0) {
                状态.状态 = '等待空间';
            }
        }

        if (状态.状态 === '等待空间') {
            // ⚠️ 所有容量校验和增加库存都传入 cid
            const 是否塞得下 = 配方.输出.every(产物 => {
                const 上限 = 计算机.获取物品库存上限(产物.id, cid);
                const 当前 = 库存.查询库存(产物.id, cid);
                return 当前 + 产物.数量 <= 上限;
            });

            if (是否塞得下) {
                let 导致突变 = false;
                for (const 产物 of 配方.输出) {
                    if (库存.查询库存(产物.id, cid) === 0) 导致突变 = true;
                    库存.库存增加(产物.id, 产物.数量, cid);
                }

                if (导致突变) 引擎信号.需要重新结算 = true;

                状态.当前配方ID = null;
                状态.目标殖民地ID = null; // 重置
                状态.进度 = 0;
                状态.状态 = '空闲';
            }
        }
    };

    return {
        任务状态: computed(() => 状态),
        开始生产,
        逻辑更新
    };
}