// src/composables/ying_jian_diao_du.js
import { use库存 } from '@/stores/ku_cun.js';
import { use计算机系统 } from '@/stores/ji_suan_ji_xi_tong.js';
import { 获取物品数据, 获取物品存储类别 } from '@/pei_zhi_shu_ju.js';
import { use游戏控制 } from '@/stores/you_xi_kong_zhi.js'
import { use生产线系统 } from '@/stores/sheng_chan_xian_xi_tong.js';
import { useMessage } from 'naive-ui';
import { use算力监控 } from './suan_li_jian_kong.js';
import { use配方分配 } from '@/stores/pei_fang_fen_pei.js'
import { 格式化字节 } from '@/gong_ju.js';
import { 引擎信号 } from '@/systems/quan_ju_xin_hao.js';

export function use硬件调度() {
    const 库存 = use库存();
    const 计算机 = use计算机系统();
    const 游戏控制 = use游戏控制()
    const message = useMessage();

    const 尝试安装主板 = (物品id, cid) => {
        if (!cid) return false;
        const 机箱 = 计算机.本地插槽[cid];
        if (机箱?.装备的主板) return false;

        if (库存.库存减少(物品id, 1, 'cloud_item_dummy_cid')) {
            计算机._安装主板(物品id, cid);
            return true;
        }
        return false;
    };

    const 尝试卸载主板 = (cid) => {
        if (!cid) return false;
        const 机箱 = 计算机.本地插槽[cid];
        if (!机箱?.装备的主板) return false;
        if (机箱.装备的内存.length > 0 || 机箱.装备的硬盘.length > 0 || 机箱.装备的CPU.length > 0) {
            message.warning("必须先拔出所有内存、硬盘和CPU，才能拆除主板！");
            return false;
        }

        const 卸载的物品id = 机箱.装备的主板;
        计算机._卸载主板(cid);
        库存.库存增加(卸载的物品id, 1, 'cloud_item_dummy_cid');
        return true;
    };

    const 尝试安装CPU = (物品id, cid) => {
        if (!cid) return false
        const 机箱 = 计算机.本地插槽[cid]
        // 校验 1：必须有主板
        if (!机箱?.装备的主板) return false

        // 校验 2：检查 CPU 数组长度是否已达到主板定义的槽位上限
        const 槽位限制 = 计算机.槽位限制(cid)
        if (机箱.装备的CPU.length >= 槽位限制.CPU) {
            message.warning('主板 CPU 插槽已满！')
            return false
        }

        // 校验 3：平台匹配检查
        const 物品数据 = 获取物品数据(物品id)
        if (物品数据.平台 && 物品数据.平台 !== 计算机.当前平台(cid)) {
            message.error('CPU 平台与当前主板不兼容！')
            return false
        }

        // 执行安装：从库存扣除并 push 进数组
        if (库存.库存减少(物品id, 1, 'cloud_item_dummy_cid')) {
            计算机._安装CPU(物品id, cid)
            return true
        }
        return false
    };

const 尝试卸载CPU = (索引index, cid) => {
        if (!cid) return false
        const 机箱 = 计算机.本地插槽[cid]
        if (!机箱 || 索引index < 0 || 索引index >= 机箱.装备的CPU.length) return false

        const 卸载的物品id = 机箱.装备的CPU[索引index]

        // 1. 允许直接卸载，退回库存
        计算机._卸载CPU(索引index, cid)
        库存.库存增加(卸载的物品id, 1, 'cloud_item_dummy_cid')

        // 2. 🌟 修复核心：全盘扫荡！算力不足的生产线强行断电停机
        const { 获取单核频率上限, 计算生产线负载 } = use算力监控();
        const 配方分配 = use配方分配();
        const 生产线系统 = use生产线系统();
        const 本地所有线 = 配方分配.查询殖民地全部(cid);

        for (const lineId in 本地所有线) {
            let 绑定核心 = 0;
            if (lineId !== 'default') {
                const 产线 = 生产线系统.数据[cid]?.find(l => l.id === lineId);
                if (产线) 绑定核心 = 产线.绑定核心索引;
            }
            
            const 频率上限 = 获取单核频率上限(绑定核心, cid);
            const 实际负载 = 计算生产线负载(lineId, cid);
            
            // 如果失去 CPU 导致该核心算力归零，或者算力被腰斩支撑不住了
            if (实际负载 > 频率上限) {
                for (const 配方id in 本地所有线[lineId]) {
                    for (const 建筑id in 本地所有线[lineId][配方id]) {
                         // 强制停机
                         本地所有线[lineId][配方id][建筑id].状态 = '停止';
                    }
                }
            }
        }
        
        // 触发全局重新结算
        import('@/systems/quan_ju_xin_hao.js').then(m => m.引擎信号.需要重新结算 = true);
        message.success(`已拔出 CPU：${获取物品数据(卸载的物品id).名称}。算力不足的产线已自动停机保护。`)
        return true
    };

    const 尝试安装内存 = (物品id, cid) => {
        if (!cid) return false;
        const 机箱 = 计算机.本地插槽[cid];
        if (!机箱?.装备的主板) return false;

        const 物品数据 = 获取物品数据(物品id);
        if (物品数据.平台 && 物品数据.平台 !== 计算机.当前平台(cid)) return false;
        if (机箱.装备的内存.length >= 计算机.槽位限制(cid).内存) return false;

        if (库存.库存减少(物品id, 1, 'cloud_item_dummy_cid')) {
            计算机._安装内存(物品id, cid);
            return true;
        }
        return false;
    };

    const 尝试卸载内存 = (index, cid) => {
        if (!cid) return false;
        const 机箱 = 计算机.本地插槽[cid];
        if (!机箱 || index < 0 || index >= 机箱.装备的内存.length) return false;

        const 卸载的物品id = 机箱.装备的内存[index];
        计算机._卸载内存(index, cid);
        库存.库存增加(卸载的物品id, 1, 'cloud_item_dummy_cid');
        return true;
    };

    const 尝试安装硬盘 = (物品id, cid) => {
        if (!cid) return false;
        const 机箱 = 计算机.本地插槽[cid];
        if (!机箱?.装备的主板) return false;

        const 物品数据 = 获取物品数据(物品id);
        if (物品数据.平台 && 物品数据.平台 !== 计算机.当前平台(cid)) return false;
        if (机箱.装备的硬盘.length >= 计算机.槽位限制(cid).硬盘) return false;

        if (库存.库存减少(物品id, 1, 'cloud_item_dummy_cid')) {
            计算机._安装硬盘(物品id, cid);
            return true;
        }
        return false;
    };

    const 尝试卸载硬盘 = (index, cid) => {
        if (!cid) return false;
        const 机箱 = 计算机.本地插槽[cid];
        if (!机箱 || index < 0 || index >= 机箱.装备的硬盘.length) return false;

        const 拟卸载硬件id = 机箱.装备的硬盘[index];
        const 拟卸载硬件 = 获取物品数据(拟卸载硬件id);
        const 类别 = 拟卸载硬件?.存储类别 || '物体';
        const 损失容量 = 拟卸载硬件?.提供容量 || 0;

        // 核心安全校验
        const 当前总容量 = 计算机.分类总容量(cid)[类别];
        const 新总容量 = 当前总容量 - 损失容量;

        // 1. 逻辑校验：不能低于已设定的保底配额或云端配额
        const 云端占用 = 类别 === '物体' ? (机箱.云端配额 || 0) : 0;
        const 逻辑保底 = 计算机.分类已分配保底(cid)[类别] + 云端占用;
        if (新总容量 < 逻辑保底) {
            message.error(`无法拔出！当前设定的保底/云端配额共需 ${格式化字节(逻辑保底)}，拔出后空间不足。`);
            return false;
        }

        //  2. 物理校验：不能低于当前仓库里已经塞进去的物资体积
        const 实际已存物资体积 = 计算机.分类已用容量(类别, cid);
        if (新总容量 < 实际已存物资体积) {
            message.error(`无法拔出！当前已存放物资体积为 ${格式化字节(实际已存物资体积)}，拔出后会导致数据溢出丢失！`);
            return false;
        }

        // 校验通过，执行底层 Store 更新
        计算机._卸载硬盘(index, cid);
        库存.库存增加(拟卸载硬件id, 1, 'cloud_item_dummy_cid');
        message.success(`成功拔出 ${拟卸载硬件.名称}`);
        return true;
    };

    const 尝试设置保底配额 = (物品id, 目标数量, cid) => {
        if (!cid) return false;
        if (目标数量 < 0) 目标数量 = 0;

        const 机箱 = 计算机.本地插槽[cid];
        const 类别 = 获取物品存储类别(物品id);
        const 单体字节 = 获取物品数据(物品id)?.字节 || 1;
        const 旧数量 = 机箱.保底配额表[物品id] || 0;
        const 增加的数量 = 目标数量 - 旧数量;
        const 需要新增的字节 = 增加的数量 * 单体字节;

        const 云端占用 = 类别 === '物体' ? (机箱.云端配额 || 0) : 0;
        const 该类总保底 = 计算机.分类已分配保底(cid)[类别] + 云端占用;
        const 该类总容量 = 计算机.分类总容量(cid)[类别] || 0;

        if (该类总保底 + 需要新增的字节 > 该类总容量) {
            message.error("剩余空间不足或被其他物品占满，分配失败！");
            return false;
        }

        计算机._设置保底配额(物品id, 目标数量, cid);
        return true;
    };

    const 尝试设置云端配额 = (目标字节, cid) => {
        if (!cid) return false;
        if (目标字节 < 0) 目标字节 = 0;

        const 机箱 = 计算机.本地插槽[cid];
        const 旧配额 = 机箱.云端配额 || 0;
        const 增加量 = 目标字节 - 旧配额;

        if (增加量 > 0) {
            const 物体总容量 = 计算机.分类总容量(cid)['物体'] || 0;
            const 物体已分配保底 = 计算机.分类已分配保底(cid)['物体'] || 0;

            if (物体已分配保底 + 旧配额 + 增加量 > 物体总容量) {
                message.warning("本地物体存储空间不足，无法划拨更多给云端！");
                return false;
            }
        } else if (增加量 < 0) {
            const 减少量 = -增加量;
            const 全网剩余空间 = 计算机.全网总云端容量 - 计算机.全网已用云端容量;
            if (减少量 > 全网剩余空间) {
                message.error("缩减失败！这会导致云端空间被撑爆，损坏现有云端资产！");
                return false;
            }
        }

        计算机._设置云端配额(目标字节, cid);
        return true;
    };

    const 强制全员卸载 = (cid) => {
        if (!cid) return false
        const 机箱 = 计算机.初始化新殖民地(cid)

        // 1. 搜集当前机箱内所有硬件
        const 待回收 = []
        if (机箱.装备的主板) 待回收.push(机箱.装备的主板)
        if (机箱.装备的CPU) 待回收.push(机箱.装备的CPU)
        机箱.装备的内存.forEach(id => 待回收.push(id))
        机箱.装备的硬盘.forEach(id => 待回收.push(id))

        // 2. 将硬件无损退回仓库
        待回收.forEach(id => {
            库存.库存增加(id, 1, 'cloud_item_dummy_cid')
        })

        // 3. 执行物理抹除
        计算机._强制清空机箱(cid)

        // 4. 🌟 强制暂停游戏，防止仓储丧失导致的生产事故
        游戏控制.暂停 = true

        message.warning('全机组已强制拆解入库。由于算力与仓储上限归零，游戏已自动暂停，请尽快安装新系统。')
        return true
    }

    return {
        尝试安装主板, 尝试卸载主板, 尝试安装CPU, 尝试卸载CPU,
        尝试安装内存, 尝试卸载内存, 尝试安装硬盘, 尝试卸载硬盘,
        尝试设置保底配额, 尝试设置云端配额, 强制全员卸载
    };
}