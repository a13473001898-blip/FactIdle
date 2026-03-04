// src/features/wu_liu_xi_tong/composables/fei_chuan_ying_jian.js
import { use飞船实体系统 } from '../store_fei_chuan.js';
import { use库存 } from '@/features/wu_pin_xi_tong/index.js';
import { useMessage } from 'naive-ui';
import { 获取物品数据 } from '@/shared/pei_zhi_shu_ju.js';
import { use计算机系统 } from '@/features/ji_suan_ji_xi_tong/store.js';

export function use飞船硬件调度() {
    const 飞船库 = use飞船实体系统();
    const 库存 = use库存();
    const 计算机 = use计算机系统();
    const message = useMessage();

    /**
     * @param {string} shipId 
     * @param {'装备的引擎'|'装备的硬盘'|'装备的网卡'|'装备的辅助'} 模块类型 
     * @param {string} 物品id 
     */
    const 尝试安装模块 = (shipId, 模块类型, 物品id) => {
        const ship = 飞船库.获取飞船(shipId);
        if (!ship) return false;

        // 1. 校验是否安装了船体
        if (!ship.装备的船体) {
            message.warning("请先安装船体（主框架），才能挂载模块！");
            return false;
        }

        // 2. 校验槽位是否已满
        const 映射 = { '装备的引擎': '引擎', '装备的硬盘': '硬盘', '装备的网卡': '网卡', '装备的辅助': '辅助' };
        const 槽位名 = 映射[模块类型];
        const 限制 = 飞船库.获取飞船槽位限制(shipId)[槽位名];

        if (ship[模块类型].length >= 限制) {
            message.error(`安装失败！该船体仅支持 ${限制} 个${槽位名}模块。`);
            return false;
        }

        // 3. 执行库存扣除与安装
        // 注意：飞船模块建议存放在云端仓库，cid 使用 'cloud_item_dummy_cid' 或你定义的全局常量
        if (库存.库存减少(物品id, 1, 'cloud_item_dummy_cid')) {
            const 成功 = 飞船库._安装模块(shipId, 模块类型, 物品id);
            if (成功) {
                message.success(`已成功挂载：${获取物品数据(物品id).名称}`);
                return true;
            }
        }

        return false;
    };

    

    const 尝试卸载模块 = (shipId, 模块类型, 索引index) => {
        const ship = 飞船库.获取飞船(shipId);
        if (!ship || !ship[模块类型]) return false;

        const 拟卸载硬件id = ship[模块类型][索引index];
        const 拟卸载硬件数据 = 获取物品数据(拟卸载硬件id);

        // 🌟 核心修复：如果是卸载硬盘，执行“减容”校验
        if (模块类型 === '装备的硬盘') {
            const 当前已载质量 = 飞船库.获取飞船已载质量(shipId);
            const 当前总容量 = 飞船库.获取飞船最大容量(shipId);
            const 减少的容量 = 拟卸载硬件数据?.提供容量 || 0;

            if (当前总容量 - 减少的容量 < 当前已载质量) {
                message.error(`无法卸载！当前物资质量为 ${当前已载质量}B，拔出该硬盘后空间不足。请先卸货！`);
                return false;
            }
        }

        const 卸载的物品id = ship[模块类型][索引index];
        飞船库._卸载模块(shipId, 模块类型, 索引index);

        // 退回库存
        库存.库存增加(卸载的物品id, 1, 'cloud_item_dummy_cid');
        message.info(`已移除模块：${获取物品数据(卸载的物品id).名称}`);
    };

    const 尝试解体飞船 = (shipId) => {
        const ship = 飞船库.获取飞船(shipId);
        if (!ship) return false;

        // 1. 状态拦截：航行中禁止拆解
        if (ship.当前状态 !== '停泊中') {
            message.error("飞船正在高速航行中，无法执行解体程序！请先等待其靠港或强制停泊。");
            return false;
        }

        const cid = ship.当前位置;


        // 3. 硬件回收（模块退回云端，船体也退回云端）
        // 定义需要遍历的所有硬件插槽
        const 插槽类型 = ['装备的引擎', '装备的硬盘', '装备的网卡', '装备的辅助'];
        插槽类型.forEach(类型 => {
            ship[类型].forEach(硬件id => {
                库存.库存增加(硬件id, 1, 'cloud_item_dummy_cid');
            });
        });

        // 回收船体（如果有）
        if (ship.装备的船体) {
            库存.库存增加(ship.装备的船体, 1, 'cloud_item_dummy_cid');
        }

        // 4. 执行物理销毁
        飞船库._解体飞船(shipId);
        message.success(`飞船 ${ship.名称} 已在星系 ${cid} 完成解体，物资与硬件已分类回收。`);
        return true;
    };

    return {
        尝试安装模块,
        尝试卸载模块,
        尝试解体飞船
    };
}